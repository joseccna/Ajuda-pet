/**
 * Testes de integração: migrações, repositórios e serviços rodando em um SQLite de verdade
 * (o do Node), com os módulos nativos do Expo trocados por versões de teste.
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
import { MIGRACOES } from '../database/migracoes';
import { Consulta } from '../models/Consulta';
import { DoseVacina } from '../models/DoseVacina';
import { Pet } from '../models/Pet';
import { RegistroPeso } from '../models/RegistroPeso';
import { ErroValidacaoConsulta, ConsultaService } from './ConsultaService';
import { PainelService } from './PainelService';
import { ErroValidacaoPeso, PesoService } from './PesoService';
import { ErroValidacao, PetService } from './PetService';
import { ErroValidacaoVacina, VacinaService } from './VacinaService';

const HOJE = new Date(2026, 9, 2, 12, 0, 0); // 2 de outubro de 2026

// Precisa do SQLite embutido do Node (versão 22.5 ou mais nova). Sem ele, os testes são pulados.
const temSqlite = Boolean(process.getBuiltinModule?.('node:sqlite'));
const suite = temSqlite ? describe : describe.skip;

const pets = new PetService();
const vacinas = new VacinaService();
const pesos = new PesoService();
const consultas = new ConsultaService();

suite('integração com o SQLite', () => {
  beforeAll(() => {
    Database.iniciar();
    DeviceIdentity.iniciar();
  });

  describe('banco', () => {
    it('aplica todas as migrações e é idempotente', () => {
      const db = Database.get();
      expect(db.getFirstSync('PRAGMA user_version').user_version).toBe(MIGRACOES.length);
      Database.iniciar();
      expect(db.getFirstSync('PRAGMA user_version').user_version).toBe(MIGRACOES.length);
    });

    it('identifica este aparelho com um id estável', () => {
      const id = DeviceIdentity.id;
      expect(id).toMatch(/^[0-9a-f-]{36}$/);
      DeviceIdentity.iniciar();
      expect(DeviceIdentity.id).toBe(id);
    });
  });

  describe('pets', () => {
    it('cria, lê, atualiza e exclui (logicamente)', () => {
      const luna = pets.salvar(new Pet({ nome: 'Luna', sexo: 'femea', nascimento: '2022-03-12' }));
      expect(luna.autorDispositivoId).toBe(DeviceIdentity.id);
      expect(luna.donoDispositivoId).toBe(DeviceIdentity.id);

      const lida = pets.buscar(luna.id);
      expect(lida.nome).toBe('Luna');
      expect(lida.nascimento).toBe('2022-03-12');

      lida.raca = 'Golden Retriever';
      pets.salvar(lida);
      expect(pets.buscar(luna.id).raca).toBe('Golden Retriever');
      expect(pets.buscar(luna.id).criadoEm).toBe(luna.criadoEm);

      pets.salvar(new Pet({ nome: 'Thor', sexo: 'macho' }));
      pets.salvar(new Pet({ nome: 'Bidu' }));
      expect(pets.listarAtivos().map((p) => p.nome)).toEqual(['Bidu', 'Luna', 'Thor']);

      pets.excluir(pets.listarAtivos().find((p) => p.nome === 'Bidu').id);
      expect(pets.listarAtivos().map((p) => p.nome)).toEqual(['Luna', 'Thor']);
    });

    it('valida e detecta nome repetido', () => {
      expect(() => pets.salvar(new Pet({ nome: '  ' }))).toThrow(ErroValidacao);
      expect(pets.nomeJaExiste('luna')).toBe(true);
      const luna = pets.listarAtivos().find((p) => p.nome === 'Luna');
      expect(pets.nomeJaExiste('Luna', luna.id)).toBe(false);
      expect(pets.nomeJaExiste('Mel')).toBe(false);
    });
  });

  describe('carteirinha de vacinas', () => {
    let luna;

    beforeAll(() => {
      luna = pets.listarAtivos().find((p) => p.nome === 'Luna');
    });

    it('cria cartões com a primeira dose e calcula a próxima', () => {
      vacinas.criarTipo({ petId: luna.id, nome: 'V8', intervaloDias: 365, dataUltimaDose: '2025-10-18' });
      vacinas.criarTipo({
        petId: luna.id,
        nome: 'Antirrábica',
        intervaloDias: 365,
        dataUltimaDose: '2025-09-27',
      });
      vacinas.criarTipo({ petId: luna.id, nome: 'Giárdia', intervaloDias: null });

      const cartoes = vacinas.carteirinha(luna.id, HOJE);
      expect(cartoes.map((c) => c.tipo.nome)).toEqual(['Antirrábica', 'V8', 'Giárdia']);

      const [antirrabica, v8, giardia] = cartoes;
      expect(antirrabica.proxima).toBe('2026-09-27');
      expect(antirrabica.situacao).toEqual({ estado: 'atrasada', dias: -5 });
      expect(antirrabica.texto).toBe('Atrasada, 5 dias');
      expect(v8.proxima).toBe('2026-10-18');
      expect(v8.texto).toBe('Vence em 16 dias');
      expect(v8.doses).toHaveLength(1);
      expect(v8.doses[0].rotulo).toBe('1ª dose');
      expect(giardia.situacao.estado).toBe('sem-previsao');
    });

    it('registrar uma dose atualiza a próxima e o rótulo sugerido', () => {
      const v8 = vacinas.carteirinha(luna.id, HOJE).find((c) => c.tipo.nome === 'V8');
      expect(vacinas.rotuloParaProximaDose(v8.tipo.id)).toBe('2ª dose');

      vacinas.salvarDose(
        new DoseVacina({ tipoId: v8.tipo.id, rotulo: 'Reforço', dataAplicacao: '2026-09-30', lote: 'L123' }),
      );
      const depois = vacinas.carteirinha(luna.id, HOJE).find((c) => c.tipo.nome === 'V8');
      expect(depois.doses.map((d) => d.dataAplicacao)).toEqual(['2026-09-30', '2025-10-18']);
      expect(depois.proxima).toBe('2027-09-30');
      expect(depois.situacao.estado).toBe('em-dia');
    });

    it('a data ajustada à mão vale no lugar da calculada', () => {
      const v8 = vacinas.carteirinha(luna.id, HOJE).find((c) => c.tipo.nome === 'V8');
      const ultima = v8.doses[0];
      ultima.proximaDoseManual = '2026-12-01';
      vacinas.salvarDose(ultima);
      const depois = vacinas.carteirinha(luna.id, HOJE).find((c) => c.tipo.nome === 'V8');
      expect(depois.proxima).toBe('2026-12-01');
      expect(depois.situacao).toEqual({ estado: 'em-dia', dias: 60 });
    });

    it('excluir a última dose recalcula a próxima com a anterior', () => {
      const v8 = vacinas.carteirinha(luna.id, HOJE).find((c) => c.tipo.nome === 'V8');
      vacinas.excluirDose(v8.doses[0].id);
      const depois = vacinas.carteirinha(luna.id, HOJE).find((c) => c.tipo.nome === 'V8');
      expect(depois.doses).toHaveLength(1);
      expect(depois.proxima).toBe('2026-10-18');
    });

    it('valida a dose e o tipo', () => {
      const v8 = vacinas.carteirinha(luna.id, HOJE).find((c) => c.tipo.nome === 'V8');
      expect(() => vacinas.salvarDose(new DoseVacina({ tipoId: v8.tipo.id, rotulo: '' }))).toThrow(
        ErroValidacaoVacina,
      );
      expect(() => vacinas.criarTipo({ petId: luna.id, nome: '', intervaloDias: 365 })).toThrow(
        ErroValidacaoVacina,
      );
      expect(() => vacinas.criarTipo({ petId: luna.id, nome: 'X', intervaloDias: NaN })).toThrow(
        ErroValidacaoVacina,
      );
      expect(vacinas.nomeDeTipoJaExiste(luna.id, 'v8')).toBe(true);
      expect(vacinas.nomeDeTipoJaExiste(luna.id, 'V10')).toBe(false);
    });

    it('gera lembretes e o painel do dia', () => {
      const lembretes = vacinas.lembretes(HOJE);
      expect(lembretes.map((l) => l.titulo).sort()).toEqual(['Antirrábica da Luna', 'V8 da Luna']);

      const painel = new PainelService([vacinas]).montar(HOJE);
      expect(painel.hoje.map((l) => l.titulo)).toEqual(['Antirrábica da Luna']);
      expect(painel.hoje[0].texto).toBe('Atrasada, 5 dias');
      expect(painel.proximos).toEqual([]);
      expect(painel.porPet[luna.id]).toEqual({ pendentes: 1, atrasados: 1 });
    });

    it('excluir o cartão tira as doses e o lembrete', () => {
      const antirrabica = vacinas.carteirinha(luna.id, HOJE).find((c) => c.tipo.nome === 'Antirrábica');
      vacinas.excluirTipo(antirrabica.tipo.id);
      const nomes = vacinas.carteirinha(luna.id, HOJE).map((c) => c.tipo.nome);
      expect(nomes).not.toContain('Antirrábica');
      expect(vacinas.lembretes(HOJE).map((l) => l.titulo)).toEqual(['V8 da Luna']);
    });

    it('pets excluídos não geram lembretes', () => {
      pets.excluir(luna.id);
      expect(vacinas.lembretes(HOJE)).toEqual([]);
    });
  });

  describe('peso', () => {
    let mel;
    const pesar = (data, pesoG) => pesos.salvar(new RegistroPeso({ petId: mel.id, data, pesoG }));

    beforeAll(() => {
      mel = pets.salvar(new Pet({ nome: 'Mel', especie: 'gato', sexo: 'femea', nascimento: '2018-05-01' }));
    });

    it('registra pesagens e resume o período', () => {
      pesar('2026-04-10', 4000);
      pesar('2026-07-15', 4100);
      pesar('2026-08-20', 4200);

      expect(pesos.listar(mel.id).map((r) => r.pesoG)).toEqual([4200, 4100, 4000]);
      const resumo = pesos.resumo(mel.id, '6m', HOJE);
      expect(resumo.serie.map((r) => r.pesoG)).toEqual([4000, 4100, 4200]);
      expect(resumo.atual.pesoG).toBe(4200);
      expect(resumo.variacao).toBe(200);
      expect(resumo.avisoVariacao).toBe(false);
      expect(pesos.resumo(mel.id, '3m', HOJE).serie).toHaveLength(2);
    });

    it('pergunta "Confere?" só para saltos grandes', () => {
      expect(pesos.conferirSalto(mel.id, 42000)?.pesoG).toBe(4200);
      expect(pesos.conferirSalto(mel.id, 4300)).toBeNull();
      const ultimo = pesos.listar(mel.id)[0];
      expect(pesos.conferirSalto(mel.id, 4150, ultimo.id)).toBeNull();
    });

    it('valida a pesagem', () => {
      expect(() => pesar('2026-10-01', 0)).toThrow(ErroValidacaoPeso);
      expect(() => pesos.salvar(new RegistroPeso({ petId: mel.id, pesoG: 4000 }))).toThrow(ErroValidacaoPeso);
    });

    it('sugere nova pesagem depois de 30 dias e para de sugerir ao pesar', () => {
      const lembretes = pesos.lembretes(HOJE).filter((l) => l.petId === mel.id);
      expect(lembretes).toHaveLength(1);
      expect(lembretes[0].titulo).toBe('Nova pesagem da Mel');
      expect(lembretes[0].texto).toBe('Última pesagem há 43 dias');

      pesar('2026-10-01', 4250);
      expect(pesos.lembretes(HOJE).filter((l) => l.petId === mel.id)).toEqual([]);
    });

    it('excluir uma pesagem recalcula o peso atual', () => {
      const recente = pesos.listar(mel.id)[0];
      expect(recente.pesoG).toBe(4250);
      pesos.excluir(recente.id);
      expect(pesos.resumo(mel.id, '6m', HOJE).atual.pesoG).toBe(4200);
    });
  });

  describe('consultas', () => {
    let mel;
    let passadaId;

    beforeAll(() => {
      mel = pets.listarAtivos().find((p) => p.nome === 'Mel');
    });

    it('guarda a consulta com a parte privada e um anexo', () => {
      const consulta = new Consulta({
        petId: mel.id,
        data: '2026-09-03',
        motivo: 'Alergia de pele',
        veterinario: 'Dra. Paula Reis',
        clinica: 'VetCare',
        diagnostico: 'Dermatite alérgica',
        retornoEm: '2026-11-10',
      });
      consultas.salvar({
        consulta,
        valorCentavos: 28000,
        anotacoes: 'Pedir desconto no retorno',
        anexos: [{ uri: 'file:///cache/receita.jpg', privado: false }],
      });
      passadaId = consulta.id;

      const d = consultas.detalhe(consulta.id);
      expect(d.consulta.motivo).toBe('Alergia de pele');
      expect(d.privada.valorCentavos).toBe(28000);
      expect(d.privada.anotacoes).toBe('Pedir desconto no retorno');
      expect(d.anexos).toHaveLength(1);
      expect(d.anexos[0].uri).toMatch(/^file:\/\/\/doc\/anexos\//);
      expect(File.copias[0][0]).toBe('file:///cache/receita.jpg');
    });

    it('separa a próxima consulta do histórico e soma o gasto do ano', () => {
      consultas.salvar({
        consulta: new Consulta({ petId: mel.id, data: '2026-10-15', hora: '14:30', motivo: 'Retorno' }),
      });
      const r = consultas.resumo(mel.id, HOJE);
      expect(r.proxima.motivo).toBe('Retorno');
      expect(r.agendadas).toHaveLength(1);
      expect(r.historico.map((c) => c.motivo)).toEqual(['Alergia de pele']);
      expect(r.gastoAnoCentavos).toBe(28000);
      expect(r.anexosPorConsulta[passadaId]).toBe(1);
    });

    it('sugere o veterinário da última consulta', () => {
      expect(consultas.profissionalSugerido(mel.id)).toEqual({
        veterinario: 'Dra. Paula Reis',
        clinica: 'VetCare',
      });
    });

    it('gera lembretes de consulta e de retorno dentro de 30 dias, e o painel junta tudo', () => {
      const titulos = consultas.lembretes(HOJE).map((l) => `${l.titulo}|${l.texto}`);
      expect(titulos).toEqual(['Consulta da Mel|Em 13 dias, 14:30']);

      const painel = new PainelService([vacinas, pesos, consultas]).montar(HOJE);
      expect(painel.proximos.map((l) => l.titulo)).toContain('Consulta da Mel');
      expect(painel.porPet[mel.id].pendentes).toBeGreaterThanOrEqual(1);
    });

    it('editar: tirar o valor, as anotações e o anexo remove a parte privada e apaga o arquivo', () => {
      const { consulta, anexos } = consultas.detalhe(passadaId);
      consultas.salvar({ consulta, valorCentavos: null, anotacoes: '', anexos: [] });

      const d = consultas.detalhe(passadaId);
      expect(d.privada).toBeNull();
      expect(d.anexos).toEqual([]);
      expect(File.apagados).toContain(anexos[0].uri);
      expect(consultas.resumo(mel.id, HOJE).gastoAnoCentavos).toBe(0);
    });

    it('dá para apagar o valor e informar outro depois (exclusão lógica não bloqueia)', () => {
      const c = new Consulta({ petId: mel.id, data: '2026-07-01', motivo: 'Vacina' });
      consultas.salvar({ consulta: c, valorCentavos: 10000, anotacoes: 'a' });
      consultas.salvar({ consulta: c, valorCentavos: null, anotacoes: '' });
      expect(consultas.detalhe(c.id).privada).toBeNull();
      consultas.salvar({ consulta: c, valorCentavos: 12000, anotacoes: 'b' });
      expect(consultas.detalhe(c.id).privada.valorCentavos).toBe(12000);
    });

    it('valida a consulta', () => {
      expect(() =>
        consultas.salvar({ consulta: new Consulta({ petId: mel.id, data: '2026-10-01', motivo: '' }) }),
      ).toThrow(ErroValidacaoConsulta);
      expect(() =>
        consultas.salvar({
          consulta: new Consulta({
            petId: mel.id,
            data: '2026-10-01',
            motivo: 'Check-up',
            retornoEm: '2026-09-01',
          }),
        }),
      ).toThrow(ErroValidacaoConsulta);
    });

    it('excluir a consulta leva a parte privada e os anexos junto', () => {
      const nova = new Consulta({ petId: mel.id, data: '2026-08-01', motivo: 'Exame' });
      consultas.salvar({
        consulta: nova,
        valorCentavos: 15000,
        anexos: [{ uri: 'file:///cache/exame.jpg', privado: true }],
      });
      expect(consultas.detalhe(nova.id).anexos[0].privado).toBe(true);

      consultas.excluir(nova.id);
      expect(consultas.detalhe(nova.id)).toBeNull();
      expect(consultas.resumo(mel.id, HOJE).historico.map((c) => c.motivo)).not.toContain('Exame');
      const n = Database.get().getFirstSync(
        'SELECT COUNT(*) AS n FROM consultas_privadas WHERE consulta_id = ? AND excluido_em IS NULL',
        [nova.id],
      );
      expect(n.n).toBe(0);
    });
  });
});
