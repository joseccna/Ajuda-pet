import { gradeDoMes } from '../models/regrasAgenda';
import { paraISO, somarDias } from '../utils/datas';
import { consultaService } from './ConsultaService';
import { cuidadoService } from './CuidadoService';
import { lembreteAvulsoService } from './LembreteAvulsoService';
import { vacinaService } from './VacinaService';

/**
 * Junta os eventos com data de todos os módulos (vacinas, cuidados, consultas e lembretes avulsos).
 * Para um módulo novo aparecer na agenda e nas notificações, basta ter um método
 * eventos(inicioISO, fimISO, hoje) e entrar na lista de provedores.
 */
export class AgendaService {
  constructor(provedores = [vacinaService, cuidadoService, consultaService, lembreteAvulsoService]) {
    this.provedores = provedores;
  }

  /** Eventos entre duas datas (inclusive), em ordem de data e hora. */
  eventos(inicioISO, fimISO, hoje = new Date()) {
    return this.provedores
      .flatMap((p) => p.eventos(inicioISO, fimISO, hoje))
      .sort(
        (a, b) =>
          a.data.localeCompare(b.data) ||
          (a.hora || '99:99').localeCompare(b.hora || '99:99') ||
          a.titulo.localeCompare(b.titulo, 'pt-BR'),
      );
  }

  /** Grade do mês (com os dias dos meses vizinhos que completam as semanas) e os eventos dela. */
  doMes(ano, mes, hoje = new Date()) {
    const grade = gradeDoMes(ano, mes);
    const eventos = this.eventos(grade[0].data, grade[grade.length - 1].data, hoje);
    return { grade, eventos };
  }

  /** Eventos dos próximos dias, para planejar as notificações. */
  proximos(dias, hoje = new Date()) {
    const hojeISO = paraISO(hoje);
    return this.eventos(hojeISO, somarDias(hojeISO, dias), hoje);
  }
}

export const agendaService = new AgendaService();
