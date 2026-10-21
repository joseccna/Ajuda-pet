/**
 * Memorial em um SQLite de verdade: despedida reversível, lembretes pausados, homenagem e linha do tempo
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
    copy() {}
    get exists() {
      return true;
    }
    delete() {}
  }
  return { Directory, File, Paths: { document: { uri: 'file:///doc/' } } };
});

import { Database } from '../database/Database';
import { DeviceIdentity } from '../database/DeviceIdentity';
import { MIGRACOES } from '../database/migracoes';
import { MarcoMemorial } from '../models/MarcoMemorial';
import { Pet } from '../models/Pet';
import { AgendaService } from './AgendaService';
import { GaleriaService } from './GaleriaService';
import { MemorialService, ErroValidacaoMemorial } from './MemorialService';
import { PetService } from './PetService';
import { VacinaService } from './VacinaService';

const temSqlite = Boolean(process.getBuiltinModule?.('node:sqlite'));
const suite = temSqlite ? describe : describe.skip;

const HOJE = new Date(2026, 9, 2, 12, 0, 0);
const pets = new PetService();
const memorial = new MemorialService();
const vacinas = new VacinaService();
const agenda = new AgendaService([vacinas]);
const galeria = new GaleriaService();

suite('memorial com o SQLite', () => {
  let bidu;
  let luna;

  beforeAll(() => {
    Database.iniciar();
    DeviceIdentity.iniciar();
    luna = pets.salvar(new Pet({ nome: 'Luna', sexo: 'femea' }));
    bidu = pets.salvar(new Pet({ nome: 'Bidu', nascimento: '2012-03-10' }));
    vacinas.criarTipo({ petId: bidu.id, nome: 'V10', intervaloDias: 365, dataUltimaDose: '2025-10-10' });
    vacinas.criarTipo({ petId: luna.id, nome: 'V8', intervaloDias: 365, dataUltimaDose: '2025-10-18' });
  });

  it('o banco chega na versão mais recente', () => {
    expect(Database.get().getFirstSync('PRAGMA user_version').user_version).toBe(MIGRACOES.length);
  });

  describe('despedida', () => {
    it('antes, o Bidu aparece nos lembretes e na agenda', () => {
      expect(vacinas.lembretes(HOJE).map((l) => l.petNome)).toContain('Bidu');
      expect(agenda.eventos('2026-10-01', '2026-10-31', HOJE).map((e) => e.petNome)).toContain('Bidu');
      expect(pets.listarAtivos().map((p) => p.nome)).toContain('Bidu');
    });

    it('valida a data e o tamanho da mensagem', () => {
      expect(() => memorial.registrarDespedida(bidu.id, { dataISO: '' })).toThrow(ErroValidacaoMemorial);
      expect(() => memorial.registrarDespedida(bidu.id, { dataISO: '2026-10-03' }, HOJE)).toThrow(
        ErroValidacaoMemorial,
      );
      expect(() => memorial.registrarDespedida(bidu.id, { dataISO: '2010-01-01' }, HOJE)).toThrow(
        ErroValidacaoMemorial,
      );
      expect(() =>
        memorial.registrarDespedida(bidu.id, { dataISO: '2025-03-14', mensagem: 'x'.repeat(2000) }, HOJE),
      ).toThrow(ErroValidacaoMemorial);
      expect(pets.buscar(bidu.id).falecido).toBe(false); // nada foi gravado
    });

    it('registra a despedida com a mensagem; o pet sai da lista e os lembretes pausam', () => {
      memorial.registrarDespedida(
        bidu.id,
        { dataISO: '2025-03-14', mensagem: 'Companheiro de todas as manhãs.' },
        HOJE,
      );

      const salvo = pets.buscar(bidu.id);
      expect(salvo.falecido).toBe(true);
      expect(salvo.dataFalecimento).toBe('2025-03-14');
      expect(pets.listarAtivos().map((p) => p.nome)).toEqual(['Luna']);
      expect(memorial.listar().map((p) => p.nome)).toEqual(['Bidu']);
      expect(memorial.homenagem(bidu.id)).toBe('Companheiro de todas as manhãs.');

      expect(vacinas.lembretes(HOJE).map((l) => l.petNome)).not.toContain('Bidu');
      expect(agenda.eventos('2026-10-01', '2026-10-31', HOJE).map((e) => e.petNome)).not.toContain('Bidu');
    });

    it('nada é apagado: a carteirinha continua lá', () => {
      expect(vacinas.carteirinha(bidu.id, HOJE).map((c) => c.tipo.nome)).toEqual(['V10']);
    });

    it('corrigir a data da despedida de um pet que já está no memorial', () => {
      memorial.registrarDespedida(bidu.id, { dataISO: '2025-03-15' }, HOJE);
      expect(pets.buscar(bidu.id).dataFalecimento).toBe('2025-03-15');
      expect(memorial.homenagem(bidu.id)).toBe('Companheiro de todas as manhãs.'); // a mensagem fica
    });
  });

  describe('homenagem', () => {
    it('atualiza a mesma em vez de criar várias, e texto vazio apaga', () => {
      memorial.salvarHomenagem(bidu.id, 'A casa ficou mais quieta, mas cheia dele.');
      expect(memorial.homenagem(bidu.id)).toBe('A casa ficou mais quieta, mas cheia dele.');
      expect(
        Database.get().getFirstSync('SELECT COUNT(*) AS n FROM homenagens WHERE excluido_em IS NULL').n,
      ).toBe(1);

      memorial.salvarHomenagem(bidu.id, '');
      expect(memorial.homenagem(bidu.id)).toBe('');
      expect(
        Database.get().getFirstSync('SELECT COUNT(*) AS n FROM homenagens WHERE excluido_em IS NULL').n,
      ).toBe(0);
    });

    it('guarda quem escreveu', () => {
      memorial.salvarHomenagem(bidu.id, 'Para sempre.');
      expect(memorial.repoHomenagens.doPet(bidu.id).autorDispositivoId).toBe(DeviceIdentity.id);
    });
  });

  describe('linha do tempo', () => {
    it('guarda os marcos em ordem, com os sem data no fim', () => {
      memorial.salvarMarco(new MarcoMemorial({ petId: bidu.id, titulo: 'Despedida', data: '2025-03-15' }));
      memorial.salvarMarco(new MarcoMemorial({ petId: bidu.id, titulo: 'Gostava de abraço', data: null }));
      const chegou = memorial.salvarMarco(
        new MarcoMemorial({ petId: bidu.id, titulo: 'Chegou em casa', data: '2012-06-10' }),
      );
      memorial.salvarMarco(
        new MarcoMemorial({ petId: bidu.id, titulo: 'Primeiro passeio na praia', data: '2012-12-20' }),
      );

      expect(memorial.marcos(bidu.id).map((m) => m.titulo)).toEqual([
        'Chegou em casa',
        'Primeiro passeio na praia',
        'Despedida',
        'Gostava de abraço',
      ]);

      chegou.titulo = 'Chegou em casa, pequenininho';
      memorial.salvarMarco(chegou);
      expect(memorial.buscarMarco(chegou.id).titulo).toBe('Chegou em casa, pequenininho');
    });

    it('valida e exclui', () => {
      expect(() => memorial.salvarMarco(new MarcoMemorial({ petId: bidu.id, titulo: ' ' }))).toThrow(
        ErroValidacaoMemorial,
      );
      const [primeiro] = memorial.marcos(bidu.id);
      memorial.excluirMarco(primeiro.id);
      expect(memorial.marcos(bidu.id)).toHaveLength(3);
    });
  });

  describe('página do memorial', () => {
    it('junta pet, homenagem, linha do tempo e fotos', () => {
      galeria.adicionar(
        bidu.id,
        [{ uri: 'file:///cache/a.jpg', thumbUri: 'file:///cache/a-t.jpg' }],
        new Date(2025, 2, 1),
      );
      const r = memorial.resumo(bidu.id);
      expect(r.pet.nome).toBe('Bidu');
      expect(r.homenagem).toBe('Para sempre.');
      expect(r.marcos).toHaveLength(3);
      expect(r.fotos).toHaveLength(1);
      expect(memorial.resumo('nao-existe')).toBeNull();
    });
  });

  describe('desfazer', () => {
    it('o pet volta para a lista, com os lembretes, e a homenagem e a linha do tempo ficam guardadas', () => {
      memorial.desfazerDespedida(bidu.id);
      const volta = pets.buscar(bidu.id);
      expect(volta.falecido).toBe(false);
      expect(volta.dataFalecimento).toBeNull();
      expect(
        pets
          .listarAtivos()
          .map((p) => p.nome)
          .sort(),
      ).toEqual(['Bidu', 'Luna']);
      expect(memorial.listar()).toEqual([]);
      expect(vacinas.lembretes(HOJE).map((l) => l.petNome)).toContain('Bidu');
      expect(memorial.homenagem(bidu.id)).toBe('Para sempre.');
      expect(memorial.marcos(bidu.id)).toHaveLength(3);
    });
  });
});
