import { planejarNotificacoes } from '../models/regrasAgenda';
import { planejarLembreteBackup } from '../models/regrasBackup';
import { agendaService } from './AgendaService';
import { alimentacaoService } from './AlimentacaoService';
import { preferenciasService } from './PreferenciasService';

/**
 * Canal com importância alta: o aviso aparece por cima da tela mesmo com outro app aberto.
 * O Android não deixa mudar a importância de um canal que já existe, por isso o nome novo;
 * o canal antigo ("lembretes", de importância padrão) é apagado.
 */
const CANAL = 'avisos';
const CANAL_ANTIGO = 'lembretes';

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
 * Economia de bateria do Android. Muitos celulares (vivo, Samsung, Xiaomi...) seguram os avisos
 * até o app ser aberto quando ele está na economia de bateria. O app não pode mudar isso sozinho:
 * pede ao Android a janela "Permitir que o app sempre seja executado em segundo plano?".
 * Fora do Android, ou sem os módulos, devolve null (não dá para saber nem pedir).
 */
function carregarBateria() {
  if (plataforma() !== 'android') return null;
  try {
    const Battery = require('expo-battery');
    const IntentLauncher = require('expo-intent-launcher');
    const Application = require('expo-application');
    return {
      otimizacaoLigada: () => Battery.isBatteryOptimizationEnabledAsync(),
      pedirLiberacao: async () => {
        try {
          await IntentLauncher.startActivityAsync(
            IntentLauncher.ActivityAction.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
            { data: `package:${Application.applicationId}` },
          );
        } catch {
          // Alguns celulares não têm a janela: abre a lista de apps da economia de bateria.
          await IntentLauncher.startActivityAsync(
            IntentLauncher.ActivityAction.IGNORE_BATTERY_OPTIMIZATION_SETTINGS,
          );
        }
      },
    };
  } catch {
    return null;
  }
}

/**
 * Notificações locais (sem servidor). A cada atualização, apaga as agendadas e agenda de novo
 * as dos próximos dias, a partir dos eventos da agenda. Só funciona com a permissão do usuário.
 */
export class NotificacaoService {
  constructor(
    agenda = agendaService,
    nativo = undefined,
    preferencias = preferenciasService,
    alimentacao = alimentacaoService,
    bateria = undefined,
  ) {
    this.agenda = agenda;
    this.preferencias = preferencias;
    this.alimentacao = alimentacao;
    this._nativo = nativo;
    this._bateria = bateria;
    this.ocupado = false;
    this.pendente = false;
    this.temporizador = null;
  }

  get nativo() {
    if (this._nativo === undefined) this._nativo = carregarNativo();
    return this._nativo;
  }

  get bateria() {
    if (this._bateria === undefined) this._bateria = carregarBateria();
    return this._bateria;
  }

  /**
   * O app está fora da economia de bateria? true (liberado), false (ainda na economia)
   * ou null (não dá para saber neste celular).
   */
  async bateriaLiberada() {
    const B = this.bateria;
    if (!B) return null;
    try {
      return !(await B.otimizacaoLigada());
    } catch {
      return null;
    }
  }

  /** Abre a janela do Android para liberar o app da economia de bateria. Devolve o estado novo. */
  async pedirLiberarBateria() {
    const B = this.bateria;
    if (!B) return null;
    try {
      await B.pedirLiberacao();
    } catch {
      // segue para devolver o estado atual
    }
    return this.bateriaLiberada();
  }

  /**
   * Uma vez só, depois da permissão de notificação: se os avisos estão ligados e o app ainda está
   * na economia de bateria, pede para liberar. Quem recusar acha o botão em Preferências.
   */
  async pedirBateriaNaPrimeiraVez() {
    if (this.preferencias.obter().bateriaPedida) return;
    try {
      const avisos = await this.estado();
      if (!avisos.permitido) return;
      const liberada = await this.bateriaLiberada();
      if (liberada === null) return;
      if (liberada === false) await this.pedirLiberarBateria();
      this.preferencias.salvar({ bateriaPedida: true });
    } catch {
      // Sem como pedir: o app continua funcionando.
    }
  }

  /**
   * O que impede os avisos de chegarem na hora: 'notificacoes' (desligadas), 'bateria'
   * (app na economia de bateria) ou null (tudo certo, ou não dá para saber neste aparelho).
   */
  async problemaDosAvisos() {
    const avisos = await this.estado();
    if (!avisos.disponivel) return null;
    if (!avisos.permitido) return 'notificacoes';
    return (await this.bateriaLiberada()) === false ? 'bateria' : null;
  }

  /**
   * Resolve o que der com as janelas do Android: pede a permissão de notificação (ou devolve
   * 'configuracoes' se o Android não deixa mais perguntar) e, com ela, a liberação da bateria.
   * Devolve o problema que sobrou, ou 'configuracoes'.
   */
  async resolverAvisos() {
    let avisos = await this.estado();
    if (avisos.disponivel && !avisos.permitido) {
      if (!avisos.podePedir) return 'configuracoes';
      avisos = await this.pedirPermissao();
      if (!avisos.permitido) return 'notificacoes';
      this.reagendarEmBreve();
    }
    if ((await this.bateriaLiberada()) === false) {
      await this.pedirLiberarBateria();
      this.preferencias.salvar({ bateriaPedida: true });
    }
    return this.problemaDosAvisos();
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
          importance: N.AndroidImportance.HIGH,
        });
        try {
          await N.deleteNotificationChannelAsync(CANAL_ANTIGO);
        } catch {
          // já não existia
        }
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

  /**
   * Na primeira abertura do app, pede a permissão de notificação (como outros apps fazem).
   * Pede uma vez só: depois, quem quiser ativar usa o botão da Agenda.
   */
  async pedirNaPrimeiraVez() {
    if (this.preferencias.obter().notificacaoPedida) return;
    try {
      const atual = await this.estado();
      if (!atual.disponivel) return;
      if (!atual.permitido && atual.podePedir) await this.pedirPermissao();
      this.preferencias.salvar({ notificacaoPedida: true });
    } catch {
      // Sem notificações neste ambiente: o app continua funcionando.
    }
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
      const backup = planejarLembreteBackup(
        prefs.ultimoBackupEm,
        prefs.lembreteBackupDias,
        agora,
        prefs.horarioPadrao,
      );
      // Refeições: na hora e, se não for marcada, 1 hora depois.
      let refeicoes = [];
      try {
        refeicoes = this.alimentacao ? this.alimentacao.avisos(agora) : [];
      } catch {
        refeicoes = [];
      }
      // Os mais próximos primeiro: se o sistema congelar o app no meio (alguns celulares fazem isso
      // logo que ele sai da tela), os avisos que chegam antes já estão agendados.
      const todos = [...plano, ...(backup ? [backup] : []), ...refeicoes].sort((a, b) => a.quando - b.quando);
      let agendadas = 0;
      const comecou = Date.now();
      for (const item of todos) {
        // Pula o que venceu enquanto agendava (o tempo corrido conta a partir de "agora").
        if (item.quando.getTime() <= agora.getTime() + (Date.now() - comecou)) continue;
        try {
          await N.scheduleNotificationAsync({
            content: { title: item.titulo, body: item.corpo, data: { rota: item.rota } },
            trigger: { type: N.SchedulableTriggerInputTypes.DATE, date: item.quando, channelId: CANAL },
          });
          agendadas += 1;
        } catch {
          // Um aviso com problema não impede os outros.
        }
      }
      return { agendadas };
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

  /**
   * Se há um reagendamento esperando o tempo de juntar chamadas, faz agora. Usado quando o app
   * vai para o fundo: o sistema pode congelá-lo antes de o tempo acabar.
   */
  reagendarSePendente() {
    if (!this.temporizador) return;
    clearTimeout(this.temporizador);
    this.temporizador = null;
    this.reagendar();
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
