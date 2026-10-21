/**
 * Preferências: gravação, leitura depois de "reiniciar" e o efeito de cada uma no comportamento do app,
 * em um SQLite de verdade (Node 22.5 ou mais novo; sem ele, os testes são pulados).
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
import { MIGRACOES } from '../database/migracoes';
import { Pet } from '../models/Pet';
import { RegistroPeso } from '../models/RegistroPeso';
import { PADROES } from '../models/regrasPreferencias';
import { Tutor } from '../models/Tutor';
import { EmergenciaService } from './EmergenciaService';
import { NotificacaoService } from './NotificacaoService';
import { PasseioService } from './PasseioService';
import { PesoService } from './PesoService';
import { PetService } from './PetService';
import { PreferenciasService, preferenciasService } from './PreferenciasService';
import { TutorService } from './TutorService';

const temSqlite = Boolean(process.getBuiltinModule?.('node:sqlite'));
const suite = temSqlite ? describe : describe.skip;

const HOJE = new Date(2026, 9, 2, 12, 0, 0);

suite('preferências com o SQLite', () => {
  beforeAll(() => {
    Database.iniciar();
    DeviceIdentity.iniciar();
  });

  it('o banco chega na versão mais recente', () => {
    expect(Database.get().getFirstSync('PRAGMA user_version').user_version).toBe(MIGRACOES.length);
  });

  describe('gravação e leitura', () => {
    it('sem nada gravado, vale o padrão', () => {
      expect(new PreferenciasService().obter()).toEqual(PADROES);
    });

    it('grava só o que mudou e mantém o resto', () => {
      const s = new PreferenciasService();
      const novas = s.salvar({ tema: 'escuro', metaPasseioMin: 45 });
      expect(novas).toMatchObject({
        tema: 'escuro',
        metaPasseioMin: 45,
        unidadePeso: 'automatica',
        horarioPadrao: '09:00',
      });
      s.salvar({ unidadePeso: 'kg' });
      expect(s.obter()).toMatchObject({ tema: 'escuro', metaPasseioMin: 45, unidadePeso: 'kg' });
    });

    it('depois de reiniciar o app (serviço novo), as preferências continuam', () => {
      const depois = new PreferenciasService().obter();
      expect(depois).toMatchObject({
        tema: 'escuro',
        metaPasseioMin: 45,
        unidadePeso: 'kg',
        sugerirPesagem: true,
      });
    });

    it('guarda a ordem dos atalhos e o liga/desliga da pesagem', () => {
      const s = new PreferenciasService();
      s.salvar({ atalhos: ['peso', 'passeio', 'dose'], sugerirPesagem: false });
      const lido = new PreferenciasService().obter();
      expect(lido.atalhos).toEqual(['peso', 'passeio', 'dose']);
      expect(lido.sugerirPesagem).toBe(false);
    });

    it('corrige valores inválidos para o padrão, sem estragar o resto', () => {
      const s = new PreferenciasService();
      const r = s.salvar({
        tema: 'roxo',
        horarioPadrao: '99:99',
        antecedenciaDias: 400,
        metaPasseioMin: 1,
        atalhos: [],
      });
      expect(r.tema).toBe(PADROES.tema);
      expect(r.horarioPadrao).toBe(PADROES.horarioPadrao);
      expect(r.antecedenciaDias).toBe(PADROES.antecedenciaDias);
      expect(r.metaPasseioMin).toBe(PADROES.metaPasseioMin);
      expect(r.atalhos).toEqual(PADROES.atalhos);
      expect(r.unidadePeso).toBe('kg'); // o que estava certo continua
    });

    it('há uma linha só, mesmo depois de várias gravações', () => {
      expect(
        Database.get().getFirstSync('SELECT COUNT(*) AS n FROM configuracao_app WHERE excluido_em IS NULL').n,
      ).toBe(1);
    });

    it('avisa quem assinou, e para de avisar ao cancelar', () => {
      const s = new PreferenciasService();
      const recebidos = [];
      const parar = s.assinar((p) => recebidos.push(p.tema));
      s.salvar({ tema: 'claro' });
      parar();
      s.salvar({ tema: 'escuro' });
      expect(recebidos).toEqual(['claro']);
    });
  });

  describe('efeito no comportamento do app', () => {
    const pets = new PetService();
    let luna;

    beforeAll(() => {
      preferenciasService.salvar({ ...PADROES, unidadePeso: 'automatica' });
      luna = pets.salvar(new Pet({ nome: 'Luna', sexo: 'femea' }));
      new PesoService().salvar(new RegistroPeso({ petId: luna.id, pesoG: 28400, data: '2026-08-20' }));
    });

    it('a sugestão de nova pesagem liga e desliga', () => {
      const peso = new PesoService();
      preferenciasService.salvar({ sugerirPesagem: true });
      expect(peso.lembretes(HOJE).map((l) => l.titulo)).toEqual(['Nova pesagem da Luna']);
      preferenciasService.salvar({ sugerirPesagem: false });
      expect(peso.lembretes(HOJE)).toEqual([]);
      preferenciasService.salvar({ sugerirPesagem: true });
    });

    it('a meta de passeio muda a semana e o percentual', () => {
      const passeios = new PasseioService();
      passeios.registrarManual({ petId: luna.id, data: '2026-10-02', hora: '08:00', duracaoMin: 30 });

      preferenciasService.salvar({ metaPasseioMin: 30 });
      expect(passeios.resumo(luna.id, HOJE)).toMatchObject({ percentualMeta: 100 });
      expect(passeios.resumo(luna.id, HOJE).semana.metaMin).toBe(30);

      preferenciasService.salvar({ metaPasseioMin: 60 });
      const r = passeios.resumo(luna.id, HOJE);
      expect(r.semana.metaMin).toBe(60);
      expect(r.percentualMeta).toBe(50);
      preferenciasService.salvar({ metaPasseioMin: 30 });
    });

    it('o horário e a antecedência dos avisos vêm das preferências', async () => {
      const evento = {
        chave: 'v8',
        titulo: 'V8 da Luna',
        data: '2026-10-18',
        estado: 'futuro',
        hora: '',
        antecedenciaDias: null,
        rota: null,
      };
      const nativo = {
        getPermissionsAsync: async () => ({ granted: true, canAskAgain: true }),
        cancelAllScheduledNotificationsAsync: jest.fn(async () => {}),
        scheduleNotificationAsync: jest.fn(async () => 'id'),
        SchedulableTriggerInputTypes: { DATE: 'date' },
      };
      const agenda = { proximos: () => [evento] };

      preferenciasService.salvar({ horarioPadrao: '08:30', antecedenciaDias: 1, lembreteBackupDias: 0 });
      await new NotificacaoService(agenda, nativo).reagendar(HOJE);
      const quando = nativo.scheduleNotificationAsync.mock.calls.map(([c]) => [
        c.trigger.date.getTime(),
        c.content.body,
      ]);
      expect(quando).toEqual([
        [new Date(2026, 9, 17, 8, 30).getTime(), 'Amanhã'],
        [new Date(2026, 9, 18, 8, 30).getTime(), 'É hoje'],
      ]);

      nativo.scheduleNotificationAsync.mockClear();
      preferenciasService.salvar({ antecedenciaDias: 0 });
      await new NotificacaoService(agenda, nativo).reagendar(HOJE);
      expect(nativo.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
      preferenciasService.salvar({ horarioPadrao: '09:00', antecedenciaDias: 3 });
    });

    it('a unidade de peso vale no cartão de emergência', () => {
      const emergencia = new EmergenciaService();
      new TutorService().salvar(new Tutor({ nome: 'Ana' }));

      preferenciasService.salvar({ unidadePeso: 'g' });
      expect(emergencia.cartao(luna.id, HOJE).cartao.cabecalho).toContain('28400 g');
      preferenciasService.salvar({ unidadePeso: 'kg' });
      expect(emergencia.cartao(luna.id, HOJE).cartao.cabecalho).toContain('28,4 kg');
    });
  });
});
