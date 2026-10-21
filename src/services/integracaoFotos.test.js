/**
 * Galeria de fotos, perfil do tutor e cartão de emergência em um SQLite de verdade
 * (Node 22.5 ou mais novo; sem ele, os testes são pulados).
 */
jest.mock('expo-sqlite', () => {
  const sqlite = process.getBuiltinModule?.('node:sqlite');
  if (!sqlite) return {};
  const { criarAdaptador } = require('../testes/sqliteNode');
  return { openDatabaseSync: () => criarAdaptador(sqlite.DatabaseSync) };
});
jest.mock('expo-crypto', () => ({ randomUUID: () => require('crypto').randomUUID() }));
jest.mock('expo-image-picker', () => ({}));
jest.mock('expo-image-manipulator', () => ({ ImageManipulator: {}, SaveFormat: { JPEG: 'jpeg' } }));
jest.mock('expo-file-system', () => {
  const juntar = (...partes) => partes.map((x) => (x.uri ?? x).replace(/\/+$/, '')).join('/');
  class Directory {
    constructor(...partes) {
      this.uri = juntar(...partes);
    }
    create() {}
  }
  class File {
    constructor(...partes) {
      this.uri = juntar(...partes);
    }
    copy(destino) {
      File.copias.push([this.uri, destino.uri]);
    }
    get exists() {
      return true;
    }
    delete() {
      File.apagados.push(this.uri);
    }
  }
  File.copias = [];
  File.apagados = [];
  return { Directory, File, Paths: { document: { uri: 'file:///doc/' } } };
});

import { File } from 'expo-file-system';
import { Database } from '../database/Database';
import { DeviceIdentity } from '../database/DeviceIdentity';
import { PetRepository } from '../database/repositories/PetRepository';
import { MIGRACOES } from '../database/migracoes';
import { Pet } from '../models/Pet';
import { RegistroPeso } from '../models/RegistroPeso';
import { Tutor } from '../models/Tutor';
import { ConsultaService } from './ConsultaService';
import { EmergenciaService } from './EmergenciaService';
import { GaleriaService } from './GaleriaService';
import { PesoService } from './PesoService';
import { PetService } from './PetService';
import { ErroValidacaoTutor, TutorService } from './TutorService';
import { VacinaService } from './VacinaService';

const temSqlite = Boolean(process.getBuiltinModule?.('node:sqlite'));
const suite = temSqlite ? describe : describe.skip;

const HOJE = new Date(2026, 9, 2, 12, 0, 0);
const pets = new PetService();
const galeria = new GaleriaService();
const tutores = new TutorService();
const repoPets = new PetRepository();

suite('galeria, tutor e emergência com o SQLite', () => {
  beforeAll(() => {
    Database.iniciar();
    DeviceIdentity.iniciar();
  });

  it('o banco chega na versão mais recente', () => {
    expect(Database.get().getFirstSync('PRAGMA user_version').user_version).toBe(MIGRACOES.length);
  });

  describe('galeria', () => {
    let luna;

    beforeAll(() => {
      luna = pets.salvar(new Pet({ nome: 'Luna', sexo: 'femea' }));
    });

    it('adiciona fotos guardando o arquivo e a miniatura, e lista da mais nova para a mais antiga', () => {
      galeria.adicionar(
        luna.id,
        [{ uri: 'file:///cache/a.jpg', thumbUri: 'file:///cache/a-t.jpg' }],
        new Date(2026, 8, 3, 12),
      );
      galeria.adicionar(
        luna.id,
        [
          { uri: 'file:///cache/b.jpg', thumbUri: 'file:///cache/b-t.jpg' },
          { uri: 'file:///cache/c.jpg', thumbUri: 'file:///cache/c-t.jpg' },
        ],
        HOJE,
      );

      const lista = galeria.listar(luna.id);
      expect(lista).toHaveLength(3);
      expect(lista[2].data).toBe('2026-09-03');
      expect(lista[0].data).toBe('2026-10-02');
      expect(lista[0].uri).toMatch(/^file:\/\/\/doc\/galeria\//);
      expect(lista[0].thumbUri).toMatch(/^file:\/\/\/doc\/miniaturas\//);
      expect(lista[0].miniatura).toBe(lista[0].thumbUri);
      expect(galeria.contar(luna.id)).toBe(3);
      expect(File.copias.filter(([origem]) => origem.startsWith('file:///cache/'))).toHaveLength(6);
    });

    it('guarda a legenda, limitada a 120 letras', () => {
      const foto = galeria.listar(luna.id)[0];
      galeria.atualizarLegenda(foto.id, 'Primeiro dia na praia');
      expect(galeria.buscar(foto.id).legenda).toBe('Primeiro dia na praia');
      galeria.atualizarLegenda(foto.id, 'x'.repeat(300));
      expect(galeria.buscar(foto.id).legenda).toHaveLength(120);
    });

    it('a foto do pet entra na galeria, e trocar a capa não apaga a foto anterior', () => {
      const comFoto = pets.buscar(luna.id);
      comFoto.fotoUri = 'file:///cache/capa1.jpg';
      pets.salvar(comFoto);

      const capa1 = pets.buscar(luna.id).fotoUri;
      expect(capa1).toMatch(/^file:\/\/\/doc\/fotos\//);
      expect(galeria.listar(luna.id).map((f) => f.uri)).toContain(capa1);

      const apagadosAntes = File.apagados.length;
      const trocar = pets.buscar(luna.id);
      trocar.fotoUri = 'file:///cache/capa2.jpg';
      pets.salvar(trocar);

      const capa2 = pets.buscar(luna.id).fotoUri;
      expect(capa2).not.toBe(capa1);
      expect(File.apagados.length).toBe(apagadosAntes); // a capa antiga continua na galeria
      expect(galeria.listar(luna.id).map((f) => f.uri)).toEqual(expect.arrayContaining([capa1, capa2]));
    });

    it('definir uma foto da galeria como capa', () => {
      const outra = galeria.listar(luna.id).find((f) => f.uri.includes('/galeria/'));
      expect(galeria.ehCapa(outra)).toBe(false);
      galeria.definirCapa(outra.id);
      expect(pets.buscar(luna.id).fotoUri).toBe(outra.uri);
      expect(galeria.ehCapa(galeria.buscar(outra.id))).toBe(true);
      expect(galeria.capaUri(luna.id)).toBe(outra.uri);
    });

    it('registrar a mesma foto duas vezes não duplica', () => {
      const uri = pets.buscar(luna.id).fotoUri;
      const antes = galeria.contar(luna.id);
      expect(galeria.registrarSeNaoExiste(luna.id, uri)).toBeNull();
      expect(galeria.contar(luna.id)).toBe(antes);
    });

    it('excluir fotos apaga os arquivos e, se era a capa, o pet fica sem foto', () => {
      const lista = galeria.listar(luna.id);
      const capa = lista.find((f) => galeria.ehCapa(f));
      const naoCapa = lista.find((f) => !galeria.ehCapa(f) && f.thumbUri);

      galeria.excluir([naoCapa.id]);
      expect(File.apagados).toEqual(expect.arrayContaining([naoCapa.uri, naoCapa.thumbUri]));
      expect(pets.buscar(luna.id).fotoUri).toBe(capa.uri);

      galeria.excluir([capa.id]);
      expect(pets.buscar(luna.id).fotoUri).toBeNull();
      expect(galeria.listar(luna.id).map((f) => f.id)).not.toContain(capa.id);
      expect(File.apagados).toContain(capa.uri);
    });

    it('pet cadastrado antes da galeria ganha a capa ao abrir a galeria', () => {
      const antigo = repoPets.salvar(new Pet({ nome: 'Bidu', fotoUri: 'file:///doc/fotos/velha.jpg' }));
      expect(galeria.contar(antigo.id)).toBe(0);
      expect(galeria.listar(antigo.id).map((f) => f.uri)).toEqual(['file:///doc/fotos/velha.jpg']);
      expect(galeria.listar(antigo.id)).toHaveLength(1);
    });
  });

  describe('tutor', () => {
    it('sem perfil salvo, devolve um vazio e "atual" é nulo', () => {
      expect(tutores.obter().preenchido).toBe(false);
      expect(tutores.atual()).toBeNull();
    });

    it('valida o nome, os telefones e o e-mail', () => {
      expect(() => tutores.salvar(new Tutor({ nome: '' }))).toThrow(ErroValidacaoTutor);
      expect(() => tutores.salvar(new Tutor({ nome: 'Ana', telefone: '123' }))).toThrow(ErroValidacaoTutor);
      expect(() => tutores.salvar(new Tutor({ nome: 'Ana', email: 'ana@x' }))).toThrow(ErroValidacaoTutor);
      expect(() => tutores.salvar(new Tutor({ nome: 'Ana', emergenciaTelefone: '99' }))).toThrow(
        ErroValidacaoTutor,
      );
    });

    it('salva e atualiza o mesmo perfil', () => {
      const t = tutores.salvar(
        new Tutor({
          nome: 'Ana Souza',
          apelido: 'Ana',
          telefone: '(11) 91234-5678',
          email: 'ana@email.com',
          vetNome: 'Dra. Paula Reis',
          vetClinica: 'VetCare',
          vetTelefone: '(11) 3000-0000',
        }),
      );
      const lido = tutores.atual();
      expect(lido.id).toBe(t.id);
      expect(lido.apelido).toBe('Ana');
      expect(lido.vetClinica).toBe('VetCare');
      expect(lido.autorDispositivoId).toBe(DeviceIdentity.id);

      lido.emergenciaNome = 'Camila';
      lido.emergenciaRelacao = 'irmã';
      lido.emergenciaTelefone = '(11) 98765-4321';
      tutores.salvar(lido);
      expect(tutores.atual().id).toBe(t.id);
      expect(tutores.atual().emergenciaNome).toBe('Camila');
      expect(Database.get().getFirstSync('SELECT COUNT(*) AS n FROM tutores').n).toBe(1);
    });
  });

  describe('veterinário sugerido', () => {
    it('sem consulta anterior, usa o veterinário de confiança do perfil do tutor', () => {
      const novo = pets.salvar(new Pet({ nome: 'Mel', sexo: 'femea' }));
      expect(new ConsultaService().profissionalSugerido(novo.id)).toEqual({
        veterinario: 'Dra. Paula Reis',
        clinica: 'VetCare',
      });
    });
  });

  describe('cartão de emergência', () => {
    it('junta pet, vacinas, peso e contatos, sem dados privados', () => {
      const luna = pets.salvar(
        new Pet({
          nome: 'Thor',
          sexo: 'macho',
          raca: 'Border Collie',
          observacoes: 'Alergia a frango',
          microchip: '985 112 004 567 890',
          castrado: 'sim',
        }),
      );
      new VacinaService().criarTipo({
        petId: luna.id,
        nome: 'V10',
        intervaloDias: 365,
        dataUltimaDose: '2025-10-18',
      });
      new PesoService().salvar(new RegistroPeso({ petId: luna.id, pesoG: 19500, data: '2026-10-01' }));

      const r = new EmergenciaService().cartao(luna.id, HOJE);
      expect(r.pet.nome).toBe('Thor');
      expect(r.cartao.cabecalho).toBe('Cachorro, Border Collie, 19,5 kg');
      expect(r.cartao.vacinas.texto).toBe('Nenhuma atrasada');
      expect(r.cartao.vacinas.detalhe).toBe('V10: vence em 16 dias');
      expect(r.cartao.contatos.map((c) => c.rotulo)).toEqual([
        'Tutor',
        'Contato de emergência',
        'Veterinário',
      ]);
      expect(r.cartao.textoCompartilhar).toContain('Alergia a frango');
      expect(r.cartao.textoCompartilhar).toContain('Camila, irmã, (11) 98765-4321');
      expect(r.cartao.textoCompartilhar).not.toMatch(/R\$/);
    });

    it('pet que não existe devolve nulo', () => {
      expect(new EmergenciaService().cartao('nao-existe', HOJE)).toBeNull();
    });
  });
});
