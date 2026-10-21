/**
 * Backup, ficha do pet e importação com prévia, de ponta a ponta, em um SQLite de verdade
 * (Node 22.5 ou mais novo; sem ele, os testes são pulados). Os arquivos ficam em memória.
 */
jest.mock('expo-sqlite', () => {
  const sqlite = process.getBuiltinModule?.('node:sqlite');
  if (!sqlite) return {};
  const { criarAdaptador } = require('../testes/sqliteNode');
  return { openDatabaseSync: () => criarAdaptador(sqlite.DatabaseSync) };
});
jest.mock('expo-crypto', () => ({
  randomUUID: () => require('crypto').randomUUID(),
  getRandomBytes: (n) => new Uint8Array(require('crypto').randomBytes(n)),
}));
jest.mock('expo-image-picker', () => ({}));
jest.mock('expo-image-manipulator', () => ({ ImageManipulator: {}, SaveFormat: { JPEG: 'jpeg' } }));
jest.mock('expo-file-system', () => ({
  Directory: class {},
  File: class {},
  Paths: { document: { uri: 'file:///doc/' } },
}));
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(async () => true),
  shareAsync: jest.fn(async () => {}),
}));
jest.mock('expo-print', () => ({
  printToFileAsync: jest.fn(async () => ({ uri: 'file:///cache/Print/aleatorio.pdf' })),
}));
jest.mock('react-native', () => ({ Platform: { OS: 'android' } }));

import { strFromU8, unzipSync, strToU8 } from 'fflate';
import { Database } from '../database/Database';
import { DeviceIdentity } from '../database/DeviceIdentity';
import { MIGRACOES } from '../database/migracoes';
import { BackupRepository } from '../database/repositories/BackupRepository';
import { Consulta } from '../models/Consulta';
import { Pet } from '../models/Pet';
import { RegistroCuidado } from '../models/RegistroCuidado';
import { RegistroPeso } from '../models/RegistroPeso';
import { Tutor } from '../models/Tutor';
import { SECOES_PADRAO } from '../models/regrasBackup';
import { lerPacote, montarPacote } from '../utils/pacote/formatoPacote';
import { BackupService } from './BackupService';
import { ConsultaService } from './ConsultaService';
import { CuidadoService } from './CuidadoService';
import { EmpacotadorService } from './EmpacotadorService';
import { FichaService } from './FichaService';
import { ImportacaoService } from './ImportacaoService';
import { MemorialService } from './MemorialService';
import { PesoService } from './PesoService';
import { PetService } from './PetService';
import { PreferenciasService } from './PreferenciasService';
import { TutorService } from './TutorService';
import { VacinaService } from './VacinaService';

const temSqlite = Boolean(process.getBuiltinModule?.('node:sqlite'));
const suite = temSqlite ? describe : describe.skip;

/** Arquivos em memória, com a mesma interface do adaptador real. */
class ArquivosMemoria {
  constructor() {
    this.mapa = new Map();
    this.livre = Number.MAX_SAFE_INTEGER;
    this.pastaImportados = 'importados';
  }
  ler(uri) {
    return this.mapa.get(uri) ?? null;
  }
  tamanho(uri) {
    return this.mapa.get(uri)?.length ?? 0;
  }
  gravar(pasta, nome, bytes) {
    const uri = `file:///doc/${pasta}/${nome}`;
    const criado = !this.mapa.has(uri);
    if (criado) this.mapa.set(uri, bytes);
    return { uri, criado };
  }
  gravarTemporario(nome, bytes) {
    const uri = `file:///cache/${nome}`;
    this.mapa.set(uri, bytes);
    return uri;
  }
  base64(uri) {
    return Buffer.from(this.mapa.get(uri)).toString('base64');
  }
  apagar(uri) {
    this.mapa.delete(uri);
  }
  listar(pasta) {
    return [...this.mapa.keys()]
      .filter((u) => u.startsWith(`file:///doc/${pasta}/`))
      .map((uri) => ({ uri, nome: uri.split('/').pop() }));
  }
  espacoLivre() {
    return this.livre;
  }
}

const HOJE = new Date(2026, 9, 20, 12, 0, 0);
const arquivos = new ArquivosMemoria();
const repo = new BackupRepository();
const prefs = new PreferenciasService();
const empacotador = new EmpacotadorService({ repo, arquivos });
const compartilhador = { isAvailableAsync: jest.fn(async () => true), shareAsync: jest.fn(async () => {}) };
const impressao = { printToFileAsync: jest.fn(async () => ({ uri: 'file:///cache/Print/aleatorio.pdf' })) };
const backup = new BackupService({ repo, arquivos, empacotador, preferencias: prefs, compartilhador });
const importacao = new ImportacaoService({ repo, arquivos, backup });
const ficha = new FichaService({ repo, arquivos, empacotador, impressao, compartilhador });

const pets = new PetService();
const vacinas = new VacinaService();
const pesos = new PesoService();
const consultas = new ConsultaService();
const cuidados = new CuidadoService();
const memorial = new MemorialService();
const tutores = new TutorService();

function db() {
  return Database.get();
}
function contar(tabela, onde = '1=1') {
  return db().getFirstSync(`SELECT COUNT(*) AS n FROM ${tabela} WHERE ${onde}`).n;
}
/** "Celular novo": banco vazio e identidade nova. */
function novoAparelho() {
  Database.instancia = null;
  DeviceIdentity._id = null;
  Database.iniciar();
  DeviceIdentity.iniciar();
  prefs.cache = null;
}
async function erroDe(fn) {
  try {
    await fn();
  } catch (e) {
    return e;
  }
  return null;
}

let idLuna;
let idThor;
let idConsulta;

function semear() {
  const luna = pets.salvar(
    new Pet({ nome: 'Luna', especie: 'cachorro', sexo: 'femea', raca: 'Golden', microchip: '123' }),
  );
  const thor = pets.salvar(new Pet({ nome: 'Thor', especie: 'gato', sexo: 'macho' }));
  idLuna = luna.id;
  idThor = thor.id;
  db().runSync('UPDATE pets SET foto_uri = ? WHERE id = ?', ['file:///doc/fotos/luna.jpg', idLuna]);
  arquivos.mapa.set('file:///doc/fotos/luna.jpg', new Uint8Array([10, 20, 30, 40]));

  vacinas.criarTipo({ petId: idLuna, nome: 'V8', intervaloDias: 365, dataUltimaDose: '2025-10-18' });
  pesos.salvar(new RegistroPeso({ petId: idLuna, data: '2026-09-01', pesoG: 28000 }));
  const consulta = new Consulta({
    petId: idLuna,
    data: '2026-09-03',
    motivo: 'Alergia',
    diagnostico: 'Dermatite',
  });
  consultas.salvar({ consulta, valorCentavos: 28000, anotacoes: 'SEGREDO-DA-CONSULTA', anexos: [] });
  idConsulta = consulta.id;
  db().runSync(
    `INSERT INTO anexos_consulta (id, consulta_id, uri, tipo, privado, criado_em, atualizado_em)
     VALUES ('anexo-publico-1', ?, 'file:///doc/anexos/receita.jpg', 'imagem', 0, '2026-09-03T10:00:00.000Z', '2026-09-03T10:00:00.000Z'),
            ('anexo-privado-1', ?, 'file:///doc/anexos/exame.jpg', 'imagem', 1, '2026-09-03T10:00:00.000Z', '2026-09-03T10:00:00.000Z')`,
    [idConsulta, idConsulta],
  );
  arquivos.mapa.set('file:///doc/anexos/receita.jpg', new Uint8Array([1, 1, 1]));
  arquivos.mapa.set('file:///doc/anexos/exame.jpg', new Uint8Array([2, 2, 2]));

  const tipo = cuidados.criarTipo({
    petId: idLuna,
    nome: 'Banho',
    icone: 'water-outline',
    intervaloDias: 30,
  });
  cuidados.salvarRegistro({
    registro: new RegistroCuidado({ tipoId: tipo.id, data: '2026-09-05' }),
    valorCentavos: 9000,
  });
  memorial.salvarHomenagem(idThor, 'Saudade eterna');
  tutores.salvar(new Tutor({ nome: 'Ana', telefone: '(11) 91234-5678' }));
}

function arquivoDe(resultado) {
  return arquivos.mapa.get(resultado.uri);
}

suite('backup, ficha e importação com o SQLite', () => {
  beforeAll(() => {
    Database.iniciar();
    DeviceIdentity.iniciar();
    semear();
  });

  it('o banco chega na versão mais recente (inclui o lembrete de backup)', () => {
    expect(db().getFirstSync('PRAGMA user_version').user_version).toBe(MIGRACOES.length);
    expect(MIGRACOES.length).toBeGreaterThanOrEqual(10);
  });

  describe('gerar o backup', () => {
    it('leva tudo do tutor, inclusive o que é privado, e as fotos', async () => {
      const r = await backup.gerar({ agora: HOJE });
      expect(r.nome).toBe('AjudaPet-backup-2026-10-20.ajudapet');
      expect(r.criptografado).toBe(false);
      expect(r.semArquivo).toBe(0);
      const p = lerPacote(arquivoDe(r), { versaoEsquemaApp: MIGRACOES.length });
      expect(p.cabecalho.tipo).toBe('backup');
      expect(p.cabecalho.dispositivoOrigemId).toBe(DeviceIdentity.id);
      expect(p.tabelas.pets.map((x) => x.nome).sort()).toEqual(['Luna', 'Thor']);
      expect(p.tabelas.consultas_privadas[0].anotacoes).toBe('SEGREDO-DA-CONSULTA');
      expect(p.tabelas.cuidados_privados[0].valor_centavos).toBe(9000);
      expect(p.tabelas.homenagens).toHaveLength(1);
      expect(p.tabelas.tutores[0].nome).toBe('Ana');
      expect(p.arquivos.size).toBe(3);
      expect(p.tabelas.pets.find((x) => x.nome === 'Luna').foto_uri).toMatch(/^arquivos\/[0-9a-f]{24}\.jpg$/);
    });

    it('com senha, o arquivo não mostra nada legível', async () => {
      const r = await backup.gerar({ senha: 'minha-senha', agora: HOJE });
      expect(r.criptografado).toBe(true);
      const bruto = Buffer.from(arquivoDe(r));
      expect(bruto.includes(Buffer.from('Luna'))).toBe(false);
      expect(bruto.includes(Buffer.from('SEGREDO'))).toBe(false);
    });

    it('avisa quando não há espaço livre', async () => {
      arquivos.livre = 10;
      expect(await erroDe(() => backup.gerar({ agora: HOJE }))).toMatchObject({ codigo: 'SEM_ESPACO' });
      arquivos.livre = Number.MAX_SAFE_INTEGER;
    });

    it('compartilha pelo sistema e registra a data do backup', async () => {
      const r = await backup.gerar({ agora: HOJE });
      await backup.compartilhar(r);
      expect(compartilhador.shareAsync).toHaveBeenCalledWith(
        r.uri,
        expect.objectContaining({ mimeType: 'application/octet-stream' }),
      );
      expect(backup.situacao(HOJE).nunca).toBe(true);
      backup.marcarBackupFeito(HOJE);
      expect(backup.situacao(HOJE)).toMatchObject({ nunca: false, dias: 0, devido: false });
      const depois = new Date(2026, 10, 25);
      expect(backup.situacao(depois)).toMatchObject({ devido: true });
      prefs.salvar({ lembreteBackupDias: 0 });
      expect(backup.situacao(depois).devido).toBe(false);
      prefs.salvar({ lembreteBackupDias: 30 });
    });

    it('sem compartilhamento disponível, explica o problema', async () => {
      compartilhador.isAvailableAsync.mockResolvedValueOnce(false);
      await expect(backup.compartilhar({ uri: 'x' })).rejects.toThrow(/compartilhamento/);
    });
  });

  describe('restaurar em outro aparelho', () => {
    let arquivoBackup;
    let arquivoComSenha;

    beforeAll(async () => {
      // O arquivo temporário tem sempre o mesmo nome; guarda cada versão com um nome próprio.
      const simples = await backup.gerar({ agora: HOJE });
      arquivoBackup = {
        ...simples,
        uri: arquivos.gravarTemporario('base-simples.ajudapet', arquivoDe(simples)),
      };
      const cifrado = await backup.gerar({ senha: 'minha-senha', agora: HOJE });
      arquivoComSenha = {
        ...cifrado,
        uri: arquivos.gravarTemporario('base-senha.ajudapet', arquivoDe(cifrado)),
      };
      novoAparelho();
    });

    it('mostra a prévia sem gravar nada', async () => {
      const { previa } = await importacao.abrir(arquivoBackup.uri);
      expect(previa).toMatchObject({ tipo: 'backup', mesmoAparelho: false, nadaDeNovo: false });
      expect(previa.pets.map((p) => [p.nome, p.acao]).sort()).toEqual([
        ['Luna', 'inserir'],
        ['Thor', 'inserir'],
      ]);
      expect(previa.total.novos).toBeGreaterThan(8);
      expect(previa.total.rejeitados).toBe(0);
      expect(contar('pets')).toBe(0);
    });

    it('pede a senha, recusa a errada e aceita a certa', async () => {
      expect(await erroDe(() => importacao.abrir(arquivoComSenha.uri))).toMatchObject({
        codigo: 'SENHA_NECESSARIA',
      });
      expect(await erroDe(() => importacao.abrir(arquivoComSenha.uri, 'errada'))).toMatchObject({
        codigo: 'SENHA_INCORRETA',
      });
      const { previa } = await importacao.abrir(arquivoComSenha.uri, 'minha-senha');
      expect(previa.pets).toHaveLength(2);
      expect(contar('pets')).toBe(0);
    });

    it('restaura dados, partes privadas e fotos; sem cópia de segurança, pois não havia nada aqui', async () => {
      const { sessao } = await importacao.abrir(arquivoBackup.uri);
      const r = await importacao.aplicar(sessao, HOJE);
      expect(r.falhas).toEqual([]);
      expect(r.copiaDeSeguranca).toBeNull();
      expect(contar('pets')).toBe(2);
      expect(contar('tipos_vacina')).toBe(1);
      expect(contar('registros_peso')).toBe(1);
      const d = consultas.detalhe(idConsulta);
      expect(d.privada.valorCentavos).toBe(28000);
      expect(d.privada.anotacoes).toBe('SEGREDO-DA-CONSULTA');
      expect(contar('homenagens')).toBe(1);
      const luna = db().getFirstSync('SELECT * FROM pets WHERE id = ?', [idLuna]);
      expect(luna.foto_uri).toMatch(/^file:\/\/\/doc\/importados\/[0-9a-f]{24}\.jpg$/);
      expect([...arquivos.mapa.get(luna.foto_uri)]).toEqual([10, 20, 30, 40]);
      const anexos = db().getAllSync('SELECT uri FROM anexos_consulta ORDER BY id');
      expect(anexos).toHaveLength(2);
      anexos.forEach((a) => expect(arquivos.mapa.has(a.uri)).toBe(true));
    });

    it('importar de novo mostra "nada de novo" e não muda nada', async () => {
      const { previa, sessao } = await importacao.abrir(arquivoBackup.uri);
      expect(previa.nadaDeNovo).toBe(true);
      expect(previa.total.novos + previa.total.alterados).toBe(0);
      const r = await importacao.aplicar(sessao, HOJE);
      expect(r.aplicadas).toBe(0);
      expect(contar('pets')).toBe(2);
    });
  });

  describe('regra de conflito: o mais recente ganha, nada some', () => {
    function pacoteAlterado(mutar) {
      const p = lerPacote(arquivos.mapa.get('file:///cache/base-simples.ajudapet'), {
        versaoEsquemaApp: MIGRACOES.length,
      });
      mutar(p.tabelas);
      const bytes = montarPacote({ cabecalho: p.cabecalho, tabelas: p.tabelas, arquivos: p.arquivos });
      return arquivos.gravarTemporario(`alterado-${Math.random()}.ajudapet`, bytes);
    }

    it('registro mais novo no arquivo atualiza; mais velho é mantido; e faz cópia de segurança antes', async () => {
      const nomeAtual = db().getFirstSync('SELECT nome FROM pets WHERE id = ?', [idThor]).nome;
      expect(nomeAtual).toBe('Thor');

      const novo = pacoteAlterado((t) => {
        const thor = t.pets.find((p) => p.id === idThor);
        thor.nome = 'Thor Segundo';
        thor.atualizado_em = '2099-01-01T00:00:00.000Z';
        const luna = t.pets.find((p) => p.id === idLuna);
        luna.nome = 'Luna Antiga';
        luna.atualizado_em = '2000-01-01T00:00:00.000Z';
      });
      const { previa, sessao } = await importacao.abrir(novo);
      expect(previa.pets.find((p) => p.nome === 'Thor Segundo').acao).toBe('atualizar');
      expect(previa.pets.find((p) => p.nome === 'Luna Antiga').acao).toBe('manter');
      expect(previa.total).toMatchObject({ alterados: 1, mantidos: 1 });

      const r = await importacao.aplicar(sessao, HOJE);
      expect(r.copiaDeSeguranca).toMatch(/^auto-20261020-120000\.ajudapet$/);
      expect(arquivos.listar('backups-automaticos')).toHaveLength(1);
      expect(db().getFirstSync('SELECT nome FROM pets WHERE id = ?', [idThor]).nome).toBe('Thor Segundo');
      expect(db().getFirstSync('SELECT nome FROM pets WHERE id = ?', [idLuna]).nome).toBe('Luna');
    });

    it('a cópia de segurança pode ser aberta e guarda o estado de antes da importação', async () => {
      const copia = arquivos.listar('backups-automaticos')[0];
      const p = lerPacote(arquivos.mapa.get(copia.uri), { versaoEsquemaApp: MIGRACOES.length });
      expect(p.tabelas.pets.find((x) => x.id === idThor).nome).toBe('Thor');
    });

    it('guarda só as 3 cópias de segurança mais recentes', async () => {
      for (let i = 1; i <= 4; i += 1) {
        const arq = pacoteAlterado((t) => {
          t.pets.find((p) => p.id === idThor).nome = `Thor ${i}`;
          t.pets.find((p) => p.id === idThor).atualizado_em = `2099-01-0${i + 1}T00:00:00.000Z`;
        });
        const { sessao } = await importacao.abrir(arq);
        await importacao.aplicar(sessao, new Date(2026, 9, 20 + i, 12, 0, 0));
      }
      expect(arquivos.listar('backups-automaticos')).toHaveLength(3);
    });

    it('se a gravação falhar, nada fica pela metade: banco igual e arquivos novos apagados', async () => {
      const arq = pacoteAlterado((t) => {
        t.pets.push({
          id: 'pet-novo-teste',
          nome: 'Fantasma',
          especie: 'gato',
          foto_uri: 'arquivos/aaaaaaaaaaaaaaaaaaaaaaaa.jpg',
          criado_em: '2026-10-01T10:00:00.000Z',
          atualizado_em: '2026-10-01T10:00:00.000Z',
        });
      });
      const original = arquivos.mapa.size;
      const { sessao } = await importacao.abrir(arq);
      sessao.arquivos.set('arquivos/aaaaaaaaaaaaaaaaaaaaaaaa.jpg', new Uint8Array([7, 7, 7]));
      const espiao = jest.spyOn(repo, 'aplicar').mockImplementation(() => {
        throw new Error('disco cheio');
      });
      const antes = contar('pets');
      const copiasAntes = arquivos.listar('backups-automaticos').length;
      await expect(importacao.aplicar(sessao, new Date(2026, 9, 30))).rejects.toThrow('disco cheio');
      espiao.mockRestore();
      expect(contar('pets')).toBe(antes);
      expect([...arquivos.mapa.keys()].some((u) => u.includes('aaaaaaaaaaaaaaaaaaaaaaaa'))).toBe(false);
      expect(copiasAntes).toBeGreaterThan(0);
      expect(arquivos.mapa.size).toBeLessThanOrEqual(original + 1); // no máximo a cópia de segurança nova
    });

    it('um registro que o banco recusa é pulado e relatado, sem derrubar o resto', async () => {
      const arq = pacoteAlterado((t) => {
        // segunda anotação ativa para a mesma consulta: o índice único recusa
        t.consultas_privadas.push({
          ...t.consultas_privadas[0],
          id: 'cpriv-duplicada-1',
          anotacoes: 'duplicada',
        });
        t.pets.find((p) => p.id === idLuna).observacoes = 'Atualizada pelo arquivo';
        t.pets.find((p) => p.id === idLuna).atualizado_em = '2099-06-01T00:00:00.000Z';
      });
      const { sessao } = await importacao.abrir(arq);
      const r = await importacao.aplicar(sessao, new Date(2026, 10, 1));
      expect(r.falhas.map((f) => f.id)).toEqual(['cpriv-duplicada-1']);
      expect(db().getFirstSync('SELECT observacoes FROM pets WHERE id = ?', [idLuna]).observacoes).toBe(
        'Atualizada pelo arquivo',
      );
      expect(contar('consultas_privadas', "id = 'cpriv-duplicada-1'")).toBe(0);
    });
  });

  describe('arquivo malicioso ou defeituoso', () => {
    it('caminhos de fora do pacote, nomes de coluna e de tabela perigosos não fazem efeito', async () => {
      const cab = {
        tipo: 'backup',
        versaoEsquema: MIGRACOES.length,
        geradoEm: HOJE.toISOString(),
        pacoteId: 'pacote-x-1',
        dispositivoOrigemId: 'd',
      };
      const t = '2026-10-01T10:00:00.000Z';
      const bytes = montarPacote({
        cabecalho: cab,
        tabelas: {
          pets: [
            {
              id: 'pet-malicioso1',
              nome: 'Mal',
              especie: 'gato',
              foto_uri: 'file:///data/user/0/outro/segredo.db',
              'nome) VALUES (1); DROP TABLE pets; --': 'x',
              criado_em: t,
              atualizado_em: t,
            },
          ],
          'pets; DROP TABLE pets': [{ id: 'xxxxxxxx' }],
          sqlite_master: [{ id: 'yyyyyyyy' }],
        },
      });
      const uri = arquivos.gravarTemporario('mal.ajudapet', bytes);
      const { previa, sessao } = await importacao.abrir(uri);
      expect(previa.ignoradas.sort()).toEqual(['pets; DROP TABLE pets', 'sqlite_master']);
      await importacao.aplicar(sessao, new Date(2026, 10, 2));
      const mal = db().getFirstSync("SELECT * FROM pets WHERE id = 'pet-malicioso1'");
      expect(mal.nome).toBe('Mal');
      expect(mal.foto_uri).toBeNull();
      expect(contar('pets')).toBeGreaterThan(2);
    });

    it('arquivo corrompido, vazio, de outro app ou de versão mais nova', async () => {
      const lixo = arquivos.gravarTemporario('lixo.ajudapet', new Uint8Array([1, 2, 3, 4, 5]));
      expect(await erroDe(() => importacao.abrir(lixo))).toMatchObject({ codigo: 'ARQUIVO_INVALIDO' });
      expect(await erroDe(() => importacao.abrir('file:///nao/existe.ajudapet'))).toMatchObject({
        codigo: 'ARQUIVO_INVALIDO',
      });
      const futuro = arquivos.gravarTemporario(
        'futuro.ajudapet',
        montarPacote({
          cabecalho: { tipo: 'backup', versaoEsquema: 999, geradoEm: 'x', pacoteId: 'y' },
          tabelas: {},
        }),
      );
      expect(await erroDe(() => importacao.abrir(futuro))).toMatchObject({ codigo: 'VERSAO_NOVA' });
    });

    it('sem espaço livre, a importação avisa antes de gravar', async () => {
      const { sessao } = await importacao.abrir('file:///cache/base-simples.ajudapet');
      sessao.decisoes.pets.push({
        acao: 'inserir',
        linha: {
          id: 'pet-sem-espaco',
          nome: 'X',
          criado_em: '2026-10-01T10:00:00.000Z',
          atualizado_em: '2026-10-01T10:00:00.000Z',
        },
      });
      arquivos.livre = 10;
      expect(await erroDe(() => importacao.aplicar(sessao, HOJE))).toMatchObject({ codigo: 'SEM_ESPACO' });
      arquivos.livre = Number.MAX_SAFE_INTEGER;
      expect(contar('pets', "id = 'pet-sem-espaco'")).toBe(0);
    });
  });

  describe('ficha do pet', () => {
    it('lista os pets e recusa gerar sem escolher nenhum', async () => {
      expect(ficha.petsDisponiveis().length).toBeGreaterThanOrEqual(2);
      expect(await erroDe(() => ficha.gerarPacote({ petIds: [], secoes: SECOES_PADRAO }))).toMatchObject({
        codigo: 'SEM_DADOS',
      });
    });

    it('o arquivo da ficha não leva valores, anotações, anexos privados, memorial, perfil nem aparelhos', async () => {
      const r = await ficha.gerarPacote({
        petIds: [idLuna],
        secoes: [...SECOES_PADRAO, 'consultas'],
        agora: HOJE,
      });
      expect(r.nome).toBe('Ficha-Luna-2026-10-20.ajudapet');
      const bruto = arquivoDe(r);
      const p = lerPacote(bruto, { versaoEsquemaApp: MIGRACOES.length });
      expect(p.cabecalho.tipo).toBe('ficha');
      expect(Object.keys(p.tabelas)).not.toEqual(expect.arrayContaining(['consultas_privadas']));
      const texto = JSON.stringify(p.tabelas);
      expect(texto).not.toMatch(/SEGREDO|valor_centavos|Saudade|Ana|homenagens|tutores/);
      expect(p.tabelas.consultas).toHaveLength(1);
      expect(p.tabelas.anexos_consulta.map((a) => a.id)).toEqual(['anexo-publico-1']);
      expect(p.tabelas.pets.map((x) => x.nome)).toEqual(['Luna']);
      expect(p.tabelas.pets[0].dono_dispositivo_id).toBeNull();
      // também no arquivo bruto (zip): nada do que é privado
      const dentro = unzipSync(bruto);
      Object.values(dentro).forEach((b) => expect(strFromU8(b, true)).not.toContain('SEGREDO'));
      expect(p.arquivos.size).toBe(2); // foto do pet + anexo público; o anexo privado fica de fora
    });

    it('consultas começam desligadas', async () => {
      const r = await ficha.gerarPacote({ petIds: [idLuna], secoes: SECOES_PADRAO, agora: HOJE });
      const p = lerPacote(arquivoDe(r), { versaoEsquemaApp: MIGRACOES.length });
      expect(p.tabelas.consultas).toBeUndefined();
      expect(p.tabelas.tipos_vacina).toHaveLength(1);
    });

    it('entra em outro aparelho como cópia à parte, marcada como ficha, e reimportar não duplica', async () => {
      const r = await ficha.gerarPacote({ petIds: [idLuna], secoes: SECOES_PADRAO, agora: HOJE });
      const arq = r.uri;
      novoAparelho();
      tutores.salvar(new Tutor({ nome: 'Veterinário' }));
      const { previa, sessao } = await importacao.abrir(arq);
      expect(previa.tipo).toBe('ficha');
      expect(previa.pets).toEqual([expect.objectContaining({ nome: 'Luna', acao: 'inserir' })]);
      await importacao.aplicar(sessao, HOJE);
      const luna = db().getFirstSync("SELECT * FROM pets WHERE nome = 'Luna'");
      expect(luna.origem).toBe('ficha');
      expect(luna.id).not.toBe(idLuna);
      expect(luna.dono_dispositivo_id).toBeNull();
      expect(contar('tipos_vacina')).toBe(1);
      expect(contar('consultas_privadas')).toBe(0);
      expect(contar('tutores', 'excluido_em IS NULL')).toBe(1);
      const de_novo = await importacao.abrir(arq);
      expect(de_novo.previa.nadaDeNovo).toBe(true);
    });

    it('gera o PDF com o HTML da ficha, sem dados privados', async () => {
      novoAparelho();
      semear();
      impressao.printToFileAsync.mockClear();
      arquivos.mapa.set('file:///cache/Print/aleatorio.pdf', new Uint8Array([37, 80, 68, 70]));
      const r = await ficha.gerarPdf({ petIds: [idLuna], secoes: SECOES_PADRAO, agora: HOJE });
      const { html } = impressao.printToFileAsync.mock.calls[0][0];
      expect(html).toContain('Luna');
      expect(html).toContain('V8');
      expect(html).toContain('data:image/jpeg;base64,');
      expect(html).not.toMatch(/SEGREDO|Saudade|Ana/);
      expect(r).toMatchObject({ nome: 'Ficha-Luna-2026-10-20.pdf', mimeType: 'application/pdf' });
      expect(arquivos.mapa.has(r.uri)).toBe(true);
      await ficha.compartilhar(r);
      expect(compartilhador.shareAsync).toHaveBeenLastCalledWith(
        r.uri,
        expect.objectContaining({ mimeType: 'application/pdf' }),
      );
    });
  });

  describe('preferência do lembrete', () => {
    it('é gravada e volta ao padrão se for inválida', () => {
      const p = prefs.salvar({ lembreteBackupDias: 15 });
      expect(p.lembreteBackupDias).toBe(15);
      expect(prefs.salvar({ lembreteBackupDias: 7 }).lembreteBackupDias).toBe(30);
      expect(prefs.salvar({ lembreteBackupDias: 0 }).lembreteBackupDias).toBe(0);
      prefs.cache = null;
      expect(prefs.obter().lembreteBackupDias).toBe(0);
      expect(strToU8('x').length).toBe(1);
    });
  });
});
