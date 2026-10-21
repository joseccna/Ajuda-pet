import { planejarNotificacoes } from '../models/regrasAgenda';
import { planejarLembreteBackup } from '../models/regrasBackup';
import { agendaService } from './AgendaService';
import { preferenciasService } from './PreferenciasService';

const CANAL = 'lembretes';

/** "android", "ios"... Lido só quando precisa, para o arquivo poder ser testado fora do celular. */
function plataforma() {
  try {
    return require('react-native').Platform.OS;
  } catch {
    return 'desconhecida';
  }
}
const JANELA_DIAS = 90;

/**
 * O módulo nativo é carregado só quando precisa e dentro de try/catch. Assim, se ele não estiver
 * disponível (por exemplo, no Expo Go de algumas versões do Android), o app segue funcionando
 * sem notificações, em vez de quebrar.
 */
function carregarNativo() {
  try {
    return require('expo-notifications');
  } catch {
    return null;
  }
}

/**
 * Notificações locais (sem servidor). A cada atualização, apaga as agendadas e agenda de novo
 * as dos próximos dias, a partir dos eventos da agenda. Só funciona com a permissão do usuário.
 */
export class NotificacaoService {
  constructor(agenda = agendaService, nativo = undefined, preferencias = preferenciasService) {
    this.agenda = agenda;
    this.preferencias = preferencias;
    this._nativo = nativo;
    this.ocupado = false;
    this.pendente = false;
    this.temporizador = null;
  }

  get nativo() {
    if (this._nativo === undefined) this._nativo = carregarNativo();
    return this._nativo;
  }

  /** Define como a notificação aparece com o app aberto e cria o canal do Android. */
  async configurar() {
    const N = this.nativo;
    if (!N) return;
    try {
      N.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
        }),
      });
      if (plataforma() === 'android') {
        await N.setNotificationChannelAsync(CANAL, {
          name: 'Lembretes',
          importance: N.AndroidImportance.DEFAULT,
        });
      }
    } catch {
      // Sem notificações neste ambiente: o app continua funcionando.
    }
  }

  /** { disponivel, permitido, podePedir } */
  async estado() {
    const N = this.nativo;
    if (!N) return { disponivel: false, permitido: false, podePedir: false };
    try {
      const p = await N.getPermissionsAsync();
      return { disponivel: true, permitido: Boolean(p.granted), podePedir: Boolean(p.canAskAgain) };
    } catch {
      return { disponivel: false, permitido: false, podePedir: false };
    }
  }

  /** Pede permissão ao usuário (só depois de explicar para que serve). Devolve o estado novo. */
  async pedirPermissao() {
    const N = this.nativo;
    if (!N) return this.estado();
    try {
      await N.requestPermissionsAsync();
    } catch {
      // segue para devolver o estado atual
    }
    return this.estado();
  }

  /** Apaga as notificações agendadas e agenda de novo as dos próximos 90 dias. */
  async reagendar(agora = new Date()) {
    const N = this.nativo;
    if (!N) return { agendadas: 0 };
    if (this.ocupado) {
      this.pendente = true;
      return { agendadas: 0 };
    }
    this.ocupado = true;
    try {
      const permissao = await N.getPermissionsAsync();
      if (!permissao.granted) {
        await N.cancelAllScheduledNotificationsAsync();
        return { agendadas: 0 };
      }
      await N.cancelAllScheduledNotificationsAsync();
      const prefs = this.preferencias.obter();
      const plano = planejarNotificacoes(this.agenda.proximos(JANELA_DIAS, agora), agora, {
        horaPadrao: prefs.horarioPadrao,
        antecedenciaDias: prefs.antecedenciaDias,
      });
      for (const item of plano) {
        await N.scheduleNotificationAsync({
          content: { title: item.titulo, body: item.corpo, data: { rota: item.rota } },
          trigger: { type: N.SchedulableTriggerInputTypes.DATE, date: item.quando, channelId: CANAL },
        });
      }
      const backup = planejarLembreteBackup(
        prefs.ultimoBackupEm,
        prefs.lembreteBackupDias,
        agora,
        prefs.horarioPadrao,
      );
      if (backup) {
        await N.scheduleNotificationAsync({
          content: { title: backup.titulo, body: backup.corpo, data: { rota: backup.rota } },
          trigger: { type: N.SchedulableTriggerInputTypes.DATE, date: backup.quando, channelId: CANAL },
        });
      }
      return { agendadas: plano.length + (backup ? 1 : 0) };
    } catch {
      return { agendadas: 0 };
    } finally {
      this.ocupado = false;
      if (this.pendente) {
        this.pendente = false;
        this.reagendarEmBreve();
      }
    }
  }

  /** Agenda de novo daqui a pouco, juntando várias chamadas seguidas em uma só. */
  reagendarEmBreve(esperaMs = 1500) {
    if (this.temporizador) clearTimeout(this.temporizador);
    this.temporizador = setTimeout(() => {
      this.temporizador = null;
      this.reagendar();
    }, esperaMs);
  }

  /** Chama aoTocar(rota) quando o usuário toca em uma notificação. Devolve uma função para parar de ouvir. */
  ouvirToques(aoTocar) {
    const N = this.nativo;
    if (!N) return () => {};
    try {
      const assinatura = N.addNotificationResponseReceivedListener((resposta) => {
        const rota = resposta?.notification?.request?.content?.data?.rota;
        if (rota) aoTocar(rota);
      });
      return () => assinatura.remove();
    } catch {
      return () => {};
    }
  }
}

export const notificacaoService = new NotificacaoService();
