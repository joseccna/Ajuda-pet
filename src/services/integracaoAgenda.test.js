/**
 * Agenda e notificações: lembretes avulsos, eventos de todos os módulos e o agendamento das
 * notificações, em um SQLite de verdade (Node 22.5 ou mais novo; sem ele, os testes são pulados).
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
jest.mock('react-native', () => ({ Platform: { OS: 'android' } }));

import { Database } from '../database/Database';
import { DeviceIdentity } from '../database/DeviceIdentity';
import { Consulta } from '../models/Consulta';
import { LembreteAvulso } from '../models/LembreteAvulso';
import { Pet } from '../models/Pet';
import { RegistroCuidado } from '../models/RegistroCuidado';
import { AgendaService } from './AgendaService';
import { ConsultaService } from './ConsultaService';
import { CuidadoService } from './CuidadoService';
import { ErroValidacaoLembrete, LembreteAvulsoService } from './LembreteAvulsoService';
import { NotificacaoService } from './NotificacaoService';
import { PainelService } from './PainelService';
import { PetService } from './PetService';
import { VacinaService } from './VacinaService';

const temSqlite = Boolean(process.getBuiltinModule?.('node:sqlite'));
const suite = temSqlite ? describe : describe.skip;

const HOJE = new Date(2026, 9, 2, 12, 0, 0); // sexta, 2 de outubro de 2026

const pets = new PetService();
const vacinas = new VacinaService();
const cuidados = new CuidadoService();
const consultas = new ConsultaService();
const avulsos = new LembreteAvulsoService();
const agenda = new AgendaService([vacinas, cuidados, consultas, avulsos]);

let luna;
let thor;

const novo = (extra = {}) =>
  new LembreteAvulso({
    petId: luna.id,
    tipo: 'medicacao',
    titulo: 'Vermífugo',
    data: '2026-10-18',
    ...extra,
  });

suite('integração da agenda e das notificações', () => {
  beforeAll(() => {
    Database.iniciar();
    DeviceIdentity.iniciar();
    luna = pets.salvar(new Pet({ nome: 'Luna', sexo: 'femea' }));
    thor = pets.salvar(new Pet({ nome: 'Thor', sexo: 'macho' }));
  });

  describe('lembretes avulsos', () => {
    it('cria, lê e valida', () => {
      const l = avulsos.salvar(novo({ repetir: 'mensal', hora: '08:00', observacao: 'Comprar antes' }));
      const lido = avulsos.buscar(l.id);
      expect(lido.titulo).toBe('Vermífugo');
      expect(lido.repetir).toBe('mensal');
      expect(lido.hora).toBe('08:00');
      expect(lido.antecedenciaDias).toBe(3);
      expect(lido.concluidoEm).toBeNull();

      expect(() => avulsos.salvar(novo({ titulo: ' ' }))).toThrow(ErroValidacaoLembrete);
      expect(() => avulsos.salvar(novo({ petId: '' }))).toThrow(ErroValidacaoLembrete);
      expect(() => avulsos.salvar(novo({ repetir: 'diario' }))).toThrow(ErroValidacaoLembrete);
      expect(() => avulsos.salvar(novo({ antecedenciaDias: 99 }))).toThrow(ErroValidacaoLembrete);
      avulsos.excluir(l.id);
      expect(avulsos.buscar(l.id)).toBeNull();
    });

    it('gera as repetições dentro do intervalo', () => {
      const l = avulsos.salvar(novo({ repetir: 'mensal' }));
      const ev = avulsos.eventos('2026-10-01', '2026-12-31', HOJE);
      expect(ev.map((e) => e.data)).toEqual(['2026-10-18', '2026-11-18', '2026-12-18']);
      expect(ev[0].titulo).toBe('Vermífugo da Luna');
      expect(ev[0].texto).toBe('Em 16 dias');
      expect(ev[0].estado).toBe('futuro');
      expect(ev[0].icone).toBe('medical-outline');
      avulsos.excluir(l.id);
    });

    it('concluir um que se repete avança a data; um que não repete some', () => {
      const mensal = avulsos.salvar(novo({ repetir: 'mensal', data: '2026-10-02' }));
      avulsos.concluir(mensal.id, HOJE);
      expect(avulsos.buscar(mensal.id).data).toBe('2026-11-02');

      const unico = avulsos.salvar(novo({ titulo: 'Comprar ração', data: '2026-10-05' }));
      avulsos.concluir(unico.id, HOJE);
      expect(avulsos.buscar(unico.id).concluidoEm).not.toBeNull();
      expect(avulsos.eventos('2026-10-01', '2026-10-31', HOJE).map((e) => e.titulo)).not.toContain(
        'Comprar ração da Luna',
      );

      avulsos.excluir(mensal.id);
      avulsos.excluir(unico.id);
    });

    it('concluir um que ficou muito atrasado vai direto para a próxima data de hoje em diante', () => {
      const velho = avulsos.salvar(novo({ repetir: 'mensal', data: '2026-06-05' }));
      expect(avulsos.eventos('2026-06-01', '2026-06-30', HOJE)[0].estado).toBe('atrasado');
      avulsos.concluir(velho.id, HOJE);
      expect(avulsos.buscar(velho.id).data).toBe('2026-10-05');
      avulsos.excluir(velho.id);
    });

    it('aparece no painel do dia', () => {
      const a = avulsos.salvar(novo({ titulo: 'Escovar os dentes', data: '2026-10-02', hora: '20:00' }));
      const b = avulsos.salvar(novo({ titulo: 'Pesar', data: '2026-12-25' }));
      const painel = new PainelService([avulsos]).montar(HOJE);
      expect(painel.hoje.map((l) => `${l.titulo}|${l.texto}`)).toEqual([
        'Escovar os dentes da Luna|Hoje, 20:00',
      ]);
      expect(painel.proximos).toEqual([]);
      avulsos.excluir(a.id);
      avulsos.excluir(b.id);
    });
  });

  describe('agenda com todos os módulos', () => {
    beforeAll(() => {
      vacinas.criarTipo({ petId: luna.id, nome: 'V8', intervaloDias: 365, dataUltimaDose: '2025-10-18' });
      vacinas.criarTipo({
        petId: thor.id,
        nome: 'Antirrábica',
        intervaloDias: 365,
        dataUltimaDose: '2025-09-27',
      });
      cuidados.criarTipo({
        petId: luna.id,
        nome: 'Banho',
        icone: 'water-outline',
        intervaloDias: 15,
        dataUltimo: '2026-09-20',
      });
      cuidados.salvarRegistro({
        registro: new RegistroCuidado({
          tipoId: cuidados.cartoes(luna.id, HOJE)[0].tipo.id,
          data: '2026-10-04',
          local: 'Banho e Cia',
        }),
      });
      consultas.salvar({
        consulta: new Consulta({
          petId: luna.id,
          data: '2026-09-03',
          motivo: 'Alergia',
          retornoEm: '2026-10-15',
        }),
      });
      consultas.salvar({
        consulta: new Consulta({ petId: thor.id, data: '2026-10-07', hora: '14:30', motivo: 'Check-up' }),
      });
      avulsos.salvar(novo({ titulo: 'Escovar', data: '2026-10-02', tipo: 'cuidado', repetir: '15d' }));
    });

    it('monta o mês com eventos de todos os módulos, na ordem do calendário', () => {
      const { grade, eventos } = agenda.doMes(2026, 9, HOJE);
      expect(grade).toHaveLength(35);
      const resumo = eventos.map((e) => `${e.data} ${e.titulo} (${e.estado})`);
      expect(resumo).toEqual([
        '2026-09-27 Antirrábica do Thor (atrasado)',
        '2026-10-02 Escovar da Luna (hoje)',
        '2026-10-04 Banho da Luna (futuro)',
        '2026-10-07 Check-up do Thor (futuro)',
        '2026-10-15 Retorno da Luna (futuro)',
        '2026-10-17 Escovar da Luna (futuro)',
        '2026-10-18 V8 da Luna (futuro)',
      ]);
    });

    it('a consulta que já aconteceu aparece só no mês dela, como histórico', () => {
      const setembro = agenda.doMes(2026, 8, HOJE).eventos.find((e) => e.chave.startsWith('consulta-'));
      expect(setembro.titulo).toBe('Alergia da Luna');
      expect(setembro.estado).toBe('passado');
      expect(setembro.texto).toBe('Consulta realizada');
    });

    it('cada evento sabe para onde levar ao tocar', () => {
      const { eventos } = agenda.doMes(2026, 9, HOJE);
      expect(eventos.find((e) => e.titulo === 'V8 da Luna').rota).toEqual({
        pathname: '/pet/[id]',
        params: { id: luna.id, aba: 'saude' },
      });
      expect(eventos.find((e) => e.titulo === 'Banho da Luna').rota.params.aba).toBe('rotina');
      expect(eventos.find((e) => e.titulo === 'Check-up do Thor').rota.pathname).toBe('/pet/[id]/consulta');
      expect(eventos.find((e) => e.titulo === 'Escovar da Luna').rota.pathname).toBe('/lembrete');
    });

    it('os próximos dias para as notificações', () => {
      const prox = agenda.proximos(10, HOJE);
      expect(prox.map((e) => e.data)).toEqual(['2026-10-02', '2026-10-04', '2026-10-07']);
    });

    it('pets em memorial ou excluídos saem da agenda', () => {
      const bidu = pets.salvar(new Pet({ nome: 'Bidu' }));
      vacinas.criarTipo({ petId: bidu.id, nome: 'V10', intervaloDias: 365, dataUltimaDose: '2025-10-10' });
      expect(agenda.doMes(2026, 9, HOJE).eventos.map((e) => e.petNome)).toContain('Bidu');
      pets.excluir(bidu.id);
      expect(agenda.doMes(2026, 9, HOJE).eventos.map((e) => e.petNome)).not.toContain('Bidu');
    });
  });

  describe('notificações', () => {
    const nativoFalso = ({ granted = true, canAskAgain = true } = {}) => ({
      getPermissionsAsync: jest.fn(async () => ({ granted, canAskAgain })),
      requestPermissionsAsync: jest.fn(async () => ({ granted: true })),
      cancelAllScheduledNotificationsAsync: jest.fn(async () => {}),
      scheduleNotificationAsync: jest.fn(async () => 'id'),
      setNotificationHandler: jest.fn(),
      setNotificationChannelAsync: jest.fn(async () => {}),
      addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
      AndroidImportance: { DEFAULT: 3 },
      SchedulableTriggerInputTypes: { DATE: 'date' },
    });

    it('agenda as notificações dos eventos futuros, sem os atrasados e os passados', async () => {
      const nativo = nativoFalso();
      const servico = new NotificacaoService(agenda, nativo);
      const { agendadas } = await servico.reagendar(HOJE);

      expect(agendadas).toBeGreaterThan(0);
      expect(nativo.cancelAllScheduledNotificationsAsync).toHaveBeenCalledTimes(1);
      expect(nativo.scheduleNotificationAsync).toHaveBeenCalledTimes(agendadas);

      const chamadas = nativo.scheduleNotificationAsync.mock.calls.map(([c]) => c);
      for (const c of chamadas) {
        expect(c.trigger.type).toBe('date');
        expect(c.trigger.channelId).toBe('lembretes');
        expect(c.trigger.date.getTime()).toBeGreaterThan(HOJE.getTime());
      }
      const titulos = chamadas.map((c) => c.content.title);
      expect(titulos).toContain('V8 da Luna');
      expect(titulos).toContain('Check-up do Thor');
      expect(titulos).not.toContain('Antirrábica do Thor'); // atrasada
      expect(titulos).not.toContain('Alergia da Luna'); // consulta passada

      const checkup = chamadas.find(
        (c) => c.content.title === 'Check-up do Thor' && c.content.body.startsWith('Hoje'),
      );
      expect(checkup.content.body).toBe('Hoje às 14:30');
      expect(checkup.trigger.date.getTime()).toBe(new Date(2026, 9, 7, 13, 30).getTime());
      expect(checkup.content.data.rota.pathname).toBe('/pet/[id]/consulta');
    });

    it('sem permissão, não agenda nada e limpa o que havia', async () => {
      const nativo = nativoFalso({ granted: false });
      const { agendadas } = await new NotificacaoService(agenda, nativo).reagendar(HOJE);
      expect(agendadas).toBe(0);
      expect(nativo.scheduleNotificationAsync).not.toHaveBeenCalled();
      expect(nativo.cancelAllScheduledNotificationsAsync).toHaveBeenCalledTimes(1);
    });

    it('informa o estado da permissão e pede quando o usuário quiser', async () => {
      const nativo = nativoFalso({ granted: false, canAskAgain: true });
      const servico = new NotificacaoService(agenda, nativo);
      expect(await servico.estado()).toEqual({ disponivel: true, permitido: false, podePedir: true });
      await servico.pedirPermissao();
      expect(nativo.requestPermissionsAsync).toHaveBeenCalledTimes(1);
    });

    it('se o módulo nativo não existe, o app segue sem notificações', async () => {
      const servico = new NotificacaoService(agenda, null);
      expect(await servico.estado()).toEqual({ disponivel: false, permitido: false, podePedir: false });
      expect(await servico.reagendar(HOJE)).toEqual({ agendadas: 0 });
      await expect(servico.configurar()).resolves.toBeUndefined();
      const parar = servico.ouvirToques(() => {});
      expect(typeof parar).toBe('function');
    });

    it('configura o canal do Android e o comportamento com o app aberto', async () => {
      const nativo = nativoFalso();
      await new NotificacaoService(agenda, nativo).configurar();
      expect(nativo.setNotificationHandler).toHaveBeenCalledTimes(1);
      expect(nativo.setNotificationChannelAsync).toHaveBeenCalledWith('lembretes', {
        name: 'Lembretes',
        importance: 3,
      });
    });

    it('ao tocar numa notificação, entrega a rota', () => {
      const nativo = nativoFalso();
      let ouvinte;
      nativo.addNotificationResponseReceivedListener.mockImplementation((cb) => {
        ouvinte = cb;
        return { remove: jest.fn() };
      });
      const rotas = [];
      new NotificacaoService(agenda, nativo).ouvirToques((r) => rotas.push(r));
      ouvinte({
        notification: {
          request: { content: { data: { rota: { pathname: '/lembrete', params: { lembreteId: 'x' } } } } },
        },
      });
      ouvinte({ notification: { request: { content: { data: {} } } } });
      expect(rotas).toEqual([{ pathname: '/lembrete', params: { lembreteId: 'x' } }]);
    });
  });
});
