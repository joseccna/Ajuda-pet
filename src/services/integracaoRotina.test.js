/**
 * Testes de integração da Rotina (alimentação, passeios e cuidados) em um SQLite de verdade.
 * Precisa do SQLite embutido do Node 22.5 ou mais novo; sem ele, os testes são pulados.
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
jest.mock('expo-file-system', () => ({
  Directory: class {},
  File: class {},
  Paths: { document: { uri: 'file:///doc/' } },
}));

import { Database } from '../database/Database';
import { DeviceIdentity } from '../database/DeviceIdentity';
import { MIGRACOES } from '../database/migracoes';
import { Pet } from '../models/Pet';
import { PlanoAlimentar } from '../models/PlanoAlimentar';
import { RegistroCuidado } from '../models/RegistroCuidado';
import { AlimentacaoService, ErroValidacaoPlano } from './AlimentacaoService';
import { CuidadoService, ErroValidacaoCuidado } from './CuidadoService';
import { PainelService } from './PainelService';
import { ErroValidacaoPasseio, PasseioService } from './PasseioService';
import { PetService } from './PetService';

const temSqlite = Boolean(process.getBuiltinModule?.('node:sqlite'));
const suite = temSqlite ? describe : describe.skip;

const HOJE = new Date(2026, 9, 2, 12, 0, 0); // sexta, 2 de outubro de 2026
const em = (h, m = 0, dia = 2) => new Date(2026, 9, dia, h, m, 0);

const pets = new PetService();
const alimentacao = new AlimentacaoService();
const passeios = new PasseioService();
const cuidados = new CuidadoService();

let luna;

suite('integração da rotina com o SQLite', () => {
  beforeAll(() => {
    Database.iniciar();
    DeviceIdentity.iniciar();
    luna = pets.salvar(new Pet({ nome: 'Luna', sexo: 'femea', nascimento: '2022-03-12' }));
  });

  it('o banco chega na versão mais recente', () => {
    expect(Database.get().getFirstSync('PRAGMA user_version').user_version).toBe(MIGRACOES.length);
  });

  describe('alimentação', () => {
    const novoPlano = (extra = {}) =>
      new PlanoAlimentar({
        petId: luna.id,
        tipoRacao: 'Ração Premium Adulto',
        quantidadeG: 150,
        horarios: ['19:00', '08:00'],
        sacoG: 15000,
        sacoAbertoEm: '2026-09-20',
        ...extra,
      });

    it('cria o plano com os horários em ordem', () => {
      alimentacao.criarPlano(novoPlano(), HOJE);
      const plano = alimentacao.planoVigente(luna.id);
      expect(plano.horarios).toEqual(['08:00', '19:00']);
      expect(plano.inicio).toBe('2026-10-02');
      expect(plano.fim).toBeNull();
      expect(plano.sacoG).toBe(15000);
      expect(plano.lembretes).toBe(true);
    });

    it('valida o plano', () => {
      expect(() => alimentacao.criarPlano(novoPlano({ tipoRacao: ' ' }), HOJE)).toThrow(ErroValidacaoPlano);
      expect(() => alimentacao.criarPlano(novoPlano({ horarios: [] }), HOJE)).toThrow(ErroValidacaoPlano);
      expect(() => alimentacao.criarPlano(novoPlano({ quantidadeG: 0 }), HOJE)).toThrow(ErroValidacaoPlano);
    });

    it('marca e desmarca refeições, guardando quem marcou', () => {
      const plano = alimentacao.planoVigente(luna.id);
      let dia = alimentacao.refeicoesDeHoje(luna.id, em(14, 30));
      expect(dia.refeicoes.map((r) => [r.horario, r.feita, r.passou])).toEqual([
        ['08:00', false, true],
        ['19:00', false, false],
      ]);

      expect(alimentacao.alternarRefeicao(plano, '08:00', HOJE)).toBe(true);
      dia = alimentacao.refeicoesDeHoje(luna.id, em(14, 30));
      expect(dia.refeicoes[0].feita).toBe(true);
      expect(dia.refeicoes[0].registro.autorDispositivoId).toBe(DeviceIdentity.id);

      expect(alimentacao.alternarRefeicao(plano, '08:00', HOJE)).toBe(false);
      expect(alimentacao.refeicoesDeHoje(luna.id, em(14, 30)).refeicoes[0].feita).toBe(false);
    });

    it('lembra da refeição pendente e some ao marcar', () => {
      const plano = alimentacao.planoVigente(luna.id);
      expect(alimentacao.lembretes(em(14, 30)).map((l) => l.titulo)).toEqual(['Refeição da Luna']);
      expect(alimentacao.lembretes(em(14, 30))[0].texto).toBe('Hoje, 08:00');

      alimentacao.alternarRefeicao(plano, '08:00', HOJE);
      expect(alimentacao.lembretes(em(14, 30))).toEqual([]);
      expect(alimentacao.lembretes(em(18, 15)).map((l) => l.texto)).toEqual(['Hoje, 19:00']);
      expect(alimentacao.lembretes(em(6, 0))).toEqual([]);
    });

    it('lembretes desligados não aparecem', () => {
      const plano = alimentacao.planoVigente(luna.id);
      plano.lembretes = false;
      alimentacao.corrigirPlano(plano);
      expect(alimentacao.lembretes(em(18, 15))).toEqual([]);
      plano.lembretes = true;
      alimentacao.corrigirPlano(plano);
      expect(alimentacao.lembretes(em(18, 15))).toHaveLength(1);
    });

    it('trocar o plano guarda o anterior no histórico, encerrado no dia anterior', () => {
      const depois = new Date(2026, 9, 10, 12, 0, 0);
      alimentacao.criarPlano(novoPlano({ tipoRacao: 'Ração Hipoalergênica', quantidadeG: 120 }), depois);

      const historico = alimentacao.historicoPlanos(luna.id);
      expect(historico.map((p) => [p.tipoRacao, p.inicio, p.fim])).toEqual([
        ['Ração Hipoalergênica', '2026-10-10', null],
        ['Ração Premium Adulto', '2026-10-02', '2026-10-09'],
      ]);
      expect(alimentacao.planoVigente(luna.id).tipoRacao).toBe('Ração Hipoalergênica');
    });

    it('trocar no mesmo dia substitui o plano em vez de criar um histórico vazio', () => {
      const dia = new Date(2026, 9, 10, 15, 0, 0);
      alimentacao.criarPlano(novoPlano({ tipoRacao: 'Ração Light', quantidadeG: 100 }), dia);
      const historico = alimentacao.historicoPlanos(luna.id);
      expect(historico).toHaveLength(2);
      expect(historico[0].tipoRacao).toBe('Ração Light');
    });
  });

  describe('passeios', () => {
    let passeioId;

    it('inicia o passeio e não duplica', () => {
      const p = passeios.iniciar(luna.id, em(18, 0));
      passeioId = p.id;
      expect(p.emAndamento).toBe(true);
      expect(passeios.iniciar(luna.id, em(18, 5)).id).toBe(passeioId);
      expect(passeios.ativo(luna.id).id).toBe(passeioId);
    });

    it('aparece como lembrete enquanto está em andamento', () => {
      const l = passeios.lembretes(em(18, 24));
      expect(l.map((x) => x.titulo)).toEqual(['Passeio da Luna em andamento']);
      expect(l[0].texto).toBe('24 min até agora');
    });

    it('liga e desliga marcações', () => {
      expect(passeios.alternarMarcacao(passeioId, 'xixi', em(18, 7))).toBe(true);
      expect(passeios.alternarMarcacao(passeioId, 'coco', em(18, 20))).toBe(true);
      expect(passeios.alternarMarcacao(passeioId, 'coco', em(18, 21))).toBe(false);
      expect(passeios.marcacoesDoPasseio(passeioId).map((m) => m.tipo)).toEqual(['xixi']);
    });

    it('pausa, retoma e finaliza descontando a pausa', () => {
      passeios.pausar(passeioId, em(18, 10));
      expect(passeios.buscar(passeioId).pausadoDesde).not.toBeNull();
      passeios.retomar(passeioId, em(18, 15));
      expect(passeios.buscar(passeioId).pausaTotalS).toBe(300);
      expect(passeios.buscar(passeioId).pausadoDesde).toBeNull();

      const feito = passeios.finalizar(passeioId, em(18, 40));
      expect(feito.emAndamento).toBe(false);
      expect(feito.duracaoMin).toBe(35); // 40 min - 5 min de pausa
      expect(passeios.ativo(luna.id)).toBeNull();
      expect(passeios.lembretes(em(18, 41))).toEqual([]);
    });

    it('finalizar com o passeio pausado fecha a pausa', () => {
      const p = passeios.iniciar(luna.id, em(20, 0));
      passeios.pausar(p.id, em(20, 10));
      const feito = passeios.finalizar(p.id, em(20, 20));
      expect(feito.duracaoMin).toBe(10);
      expect(feito.pausaTotalS).toBe(600);
      passeios.excluir(p.id);
    });

    it('completa com distância e observação, e valida', () => {
      passeios.concluirDetalhes(passeioId, { distanciaKm: 1.8, observacao: 'Parque' });
      const p = passeios.buscar(passeioId);
      expect(p.distanciaKm).toBe(1.8);
      expect(p.observacao).toBe('Parque');
      expect(() => passeios.concluirDetalhes(passeioId, { distanciaKm: -3 })).toThrow(ErroValidacaoPasseio);
    });

    it('registra um passeio que já aconteceu e resume a semana e a meta', () => {
      passeios.registrarManual({ petId: luna.id, data: '2026-10-01', hora: '07:30', duracaoMin: 25 });
      passeios.registrarManual({ petId: luna.id, data: '2026-09-29', duracaoMin: 45 });

      const r = passeios.resumo(luna.id, HOJE);
      expect(r.semana.dias.map((d) => d.minutos)).toEqual([0, 45, 0, 25, 35, 0, 0]);
      expect(r.semana.totalMin).toBe(105);
      expect(r.minutosHoje).toBe(35);
      expect(r.percentualMeta).toBe(100);
      expect(r.ativo).toBeNull();
      expect(r.total).toBe(3);
      expect(r.ultimo.duracaoMin).toBe(35);
    });

    it('valida a duração e exclui junto as marcações', () => {
      expect(() => passeios.registrarManual({ petId: luna.id, data: '2026-10-01', duracaoMin: 0 })).toThrow(
        ErroValidacaoPasseio,
      );
      passeios.excluir(passeioId);
      expect(passeios.marcacoesDoPasseio(passeioId)).toEqual([]);
      expect(passeios.buscar(passeioId)).toBeNull();
    });
  });

  describe('cuidados', () => {
    const tipo = (nome) => cuidados.cartoes(luna.id, HOJE).find((c) => c.tipo.nome === nome);

    it('cria os cuidados e calcula a situação de cada um', () => {
      cuidados.criarTipo({
        petId: luna.id,
        nome: 'Banho',
        icone: 'water-outline',
        intervaloDias: 15,
        dataUltimo: '2026-09-10',
      });
      cuidados.criarTipo({
        petId: luna.id,
        nome: 'Tosa',
        icone: 'cut-outline',
        intervaloDias: 60,
        dataUltimo: '2026-08-15',
      });
      cuidados.criarTipo({
        petId: luna.id,
        nome: 'Antipulgas',
        icone: 'bug-outline',
        intervaloDias: 30,
        dataUltimo: '2026-09-10',
      });
      cuidados.criarTipo({ petId: luna.id, nome: 'Vermífugo', intervaloDias: 90 });

      const cartoes = cuidados.cartoes(luna.id, HOJE);
      expect(cartoes.map((c) => c.tipo.nome)).toEqual(['Banho', 'Antipulgas', 'Tosa', 'Vermífugo']);
      expect(cartoes[0].situacao).toEqual({ estado: 'atrasada', dias: -7 });
      expect(cartoes[0].texto).toBe('7 dias além da data');
      expect(cartoes[0].ultimo).toBe('Último: 10 set 2026');
      expect(cartoes[1].proxima).toBe('2026-10-10');
      expect(cartoes[2].situacao.estado).toBe('em-dia');
      expect(cartoes[3].texto).toBe('Ainda não registrado');
    });

    it('valida e detecta nome repetido', () => {
      expect(() => cuidados.criarTipo({ petId: luna.id, nome: '', intervaloDias: 15 })).toThrow(
        ErroValidacaoCuidado,
      );
      expect(() => cuidados.criarTipo({ petId: luna.id, nome: 'X', intervaloDias: 0 })).toThrow(
        ErroValidacaoCuidado,
      );
      expect(cuidados.nomeDeTipoJaExiste(luna.id, 'banho')).toBe(true);
      expect(cuidados.nomeDeTipoJaExiste(luna.id, 'Escovação')).toBe(false);
    });

    it('o que está atrasado vira lembrete', () => {
      expect(cuidados.lembretes(HOJE).map((l) => `${l.titulo}|${l.texto}`)).toEqual([
        'Banho da Luna|7 dias além da data',
      ]);
    });

    it('marcar como feito hoje recalcula a próxima data e tira o lembrete', () => {
      cuidados.marcarFeitoHoje(tipo('Banho').tipo.id, HOJE);
      const banho = tipo('Banho');
      expect(banho.proxima).toBe('2026-10-17');
      expect(banho.situacao).toEqual({ estado: 'em-dia', dias: 15 });
      expect(banho.registros).toHaveLength(2);
      expect(cuidados.lembretes(HOJE)).toEqual([]);
    });

    it('um agendamento próximo vira "vence em breve" e lembrete', () => {
      const tosa = tipo('Tosa');
      cuidados.salvarRegistro({
        registro: new RegistroCuidado({ tipoId: tosa.tipo.id, data: '2026-10-04', local: 'Banho e Cia' }),
      });
      const depois = tipo('Tosa');
      expect(depois.proxima).toBe('2026-10-04');
      expect(depois.situacao).toEqual({ estado: 'em-breve', dias: 2 });
      expect(cuidados.lembretes(HOJE).map((l) => `${l.titulo}|${l.texto}`)).toEqual([
        'Tosa da Luna|Em 2 dias',
      ]);
    });

    it('o valor é privado e some quando é apagado', () => {
      const registro = tipo('Antipulgas').registros[0];
      cuidados.salvarRegistro({ registro, valorCentavos: 8000 });
      expect(cuidados.detalheRegistro(registro.id).privado.valorCentavos).toBe(8000);
      expect(cuidados.detalheRegistro(registro.id).tipo.nome).toBe('Antipulgas');

      cuidados.salvarRegistro({ registro, valorCentavos: null });
      expect(cuidados.detalheRegistro(registro.id).privado).toBeNull();
    });

    it('excluir o registro e o tipo leva o valor privado junto', () => {
      const alvo = tipo('Antipulgas');
      cuidados.salvarRegistro({ registro: alvo.registros[0], valorCentavos: 5000 });
      cuidados.excluirRegistro(alvo.registros[0].id);
      expect(tipo('Antipulgas').registros).toHaveLength(0);

      const idVerm = tipo('Vermífugo').tipo.id;
      cuidados.excluirTipo(idVerm);
      expect(cuidados.cartoes(luna.id, HOJE).map((c) => c.tipo.nome)).not.toContain('Vermífugo');
      const n = Database.get().getFirstSync(
        'SELECT COUNT(*) AS n FROM cuidados_privados WHERE excluido_em IS NULL',
      );
      expect(n.n).toBe(0);
    });
  });

  it('o painel junta alimentação, passeios e cuidados', () => {
    const painel = new PainelService([alimentacao, passeios, cuidados]).montar(em(18, 15));
    const titulos = [...painel.hoje, ...painel.proximos].map((l) => l.titulo);
    expect(titulos).toContain('Refeição da Luna');
    expect(titulos).toContain('Tosa da Luna');
    expect(painel.porPet[luna.id].pendentes).toBeGreaterThanOrEqual(2);
  });

  it('pets em memorial ou excluídos não geram lembretes de rotina', () => {
    pets.excluir(luna.id);
    expect(alimentacao.lembretes(em(18, 15))).toEqual([]);
    expect(cuidados.lembretes(HOJE)).toEqual([]);
    expect(passeios.lembretes(HOJE)).toEqual([]);
  });
});
