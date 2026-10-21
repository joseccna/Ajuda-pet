import { deISO, paraISO, somarDias, somarMeses, diferencaEmDias } from '../utils/datas';

/** Agenda: calendário, repetição de lembretes, estado dos eventos e planejamento de notificações. Funções puras. */

export const TIPOS_LEMBRETE = [
  { valor: 'vacina', rotulo: 'Vacina', icone: 'shield-checkmark-outline' },
  { valor: 'consulta', rotulo: 'Consulta', icone: 'medkit-outline' },
  { valor: 'medicacao', rotulo: 'Medicação', icone: 'medical-outline' },
  { valor: 'banho', rotulo: 'Banho e tosa', icone: 'water-outline' },
  { valor: 'cuidado', rotulo: 'Outro cuidado', icone: 'sparkles-outline' },
  { valor: 'passeio', rotulo: 'Passeio', icone: 'timer-outline' },
];

export const ICONE_LEMBRETE_PADRAO = 'notifications-outline';

export function iconeDoTipo(tipo) {
  return TIPOS_LEMBRETE.find((t) => t.valor === tipo)?.icone ?? ICONE_LEMBRETE_PADRAO;
}

export const REPETICOES = [
  { valor: 'nao', rotulo: 'Não repetir' },
  { valor: '15d', rotulo: 'A cada 15 dias' },
  { valor: 'mensal', rotulo: 'Todo mês' },
  { valor: '3m', rotulo: 'A cada 3 meses' },
  { valor: 'anual', rotulo: 'Todo ano' },
];

export const ANTECEDENCIAS = [
  { valor: 0, rotulo: 'Na hora' },
  { valor: 1, rotulo: '1 dia' },
  { valor: 3, rotulo: '3 dias' },
  { valor: 7, rotulo: '7 dias' },
];

/** Próxima data de um lembrete que se repete. "nao" devolve null. */
export function proximaData(dataISO, repetir) {
  switch (repetir) {
    case '15d':
      return somarDias(dataISO, 15);
    case 'mensal':
      return somarMeses(dataISO, 1);
    case '3m':
      return somarMeses(dataISO, 3);
    case 'anual':
      return somarMeses(dataISO, 12);
    default:
      return null;
  }
}

/** Datas em que o lembrete cai dentro do intervalo (inclusive). Para os que se repetem, gera as ocorrências. */
export function ocorrenciasNoIntervalo(dataISO, repetir, inicioISO, fimISO) {
  const datas = [];
  let d = dataISO;
  for (let i = 0; i < 400 && d && d <= fimISO; i++) {
    if (d >= inicioISO) datas.push(d);
    d = proximaData(d, repetir);
  }
  return datas;
}

/**
 * Estado de um evento em relação a hoje:
 * atrasado (já passou e continua pendente), hoje, futuro ou passado (já aconteceu, só histórico).
 */
export function estadoPorData(dataISO, hojeISO, pendente = true) {
  if (dataISO < hojeISO) return pendente ? 'atrasado' : 'passado';
  if (dataISO === hojeISO) return 'hoje';
  return 'futuro';
}

/** Contrato de evento da agenda. Todo módulo com datas devolve eventos assim. */
export function criarEvento(dados) {
  return { hora: '', antecedenciaDias: null, ...dados };
}

/** Eventos de um pet (ou de todos, com "todos"). */
export function filtrarPorPet(eventos, petId) {
  return petId === 'todos' ? eventos : eventos.filter((e) => e.petId === petId);
}

/** { 'aaaa-mm-dd': [eventos] }, cada dia em ordem de hora (sem hora vem depois). */
export function agruparPorDia(eventos) {
  const grupos = {};
  for (const e of eventos) (grupos[e.data] ??= []).push(e);
  for (const dia of Object.keys(grupos)) {
    grupos[dia].sort(
      (a, b) =>
        (a.hora || '99:99').localeCompare(b.hora || '99:99') || a.titulo.localeCompare(b.titulo, 'pt-BR'),
    );
  }
  return grupos;
}

/** Cor do ponto do calendário: coral (atrasado), verde (hoje), âmbar (em breve) ou neutro (já passou). */
export function corDoPonto(estado) {
  return { atrasado: 'coral', hoje: 'verde', futuro: 'ambar', passado: 'neutro' }[estado] ?? 'neutro';
}

/** Cores distintas dos eventos de um dia, na ordem de urgência. */
export function pontosDoDia(eventosDoDia) {
  const ordem = ['coral', 'verde', 'ambar', 'neutro'];
  const cores = new Set(eventosDoDia.map((e) => corDoPonto(e.estado)));
  return ordem.filter((c) => cores.has(c));
}

/**
 * Grade do mês, com semanas completas começando no domingo.
 * mes: 0 a 11 (como no Date do JavaScript).
 */
export function gradeDoMes(ano, mes) {
  const primeiro = new Date(ano, mes, 1, 12, 0, 0);
  const ultimo = new Date(ano, mes + 1, 0, 12, 0, 0);
  const inicio = new Date(ano, mes, 1 - primeiro.getDay(), 12, 0, 0);
  const fim = new Date(ano, mes, ultimo.getDate() + (6 - ultimo.getDay()), 12, 0, 0);
  const dias = [];
  for (
    let d = new Date(inicio);
    d <= fim;
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 12, 0, 0)
  ) {
    dias.push({ data: paraISO(d), doMes: d.getMonth() === mes, numero: d.getDate() });
  }
  return dias;
}

/** Mês anterior ou seguinte: { ano, mes }. */
export function mudarMes({ ano, mes }, delta) {
  const d = new Date(ano, mes + delta, 1, 12, 0, 0);
  return { ano: d.getFullYear(), mes: d.getMonth() };
}

/** "dias" em texto: "Hoje", "Amanhã", "Em 5 dias", "3 dias além da data". */
export function textoDias(dias, hora = '') {
  const sufixo = hora ? `, ${hora}` : '';
  if (dias < 0) {
    const n = -dias;
    return `${n} ${n === 1 ? 'dia' : 'dias'} além da data`;
  }
  if (dias === 0) return `Hoje${sufixo}`;
  if (dias === 1) return `Amanhã${sufixo}`;
  return `Em ${dias} dias${sufixo}`;
}

export const HORA_PADRAO_NOTIFICACAO = '09:00';
export const ANTECEDENCIA_PADRAO_DIAS = 3;
export const LIMITE_NOTIFICACOES = 60;
/** Quando o evento tem hora, o aviso do dia chega esta quantidade de minutos antes. */
export const MINUTOS_ANTES_DO_EVENTO = 60;

function dataComHora(dataISO, hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const d = deISO(dataISO);
  d.setHours(h, m, 0, 0);
  return d;
}

/**
 * Decide quais notificações agendar. Para cada evento pendente (não atrasado, não passado):
 * - um aviso no dia (na hora do evento menos 1 hora, ou no horário padrão se não tiver hora);
 * - um aviso de antecedência (por padrão 3 dias antes, no horário padrão), se maior que zero.
 * Só entra o que ainda está no futuro. O sistema limita o total (64 no iOS), então é cortado em 60.
 */
export function planejarNotificacoes(eventos, agora, config = {}) {
  const horaPadrao = config.horaPadrao ?? HORA_PADRAO_NOTIFICACAO;
  const antecedenciaPadrao = config.antecedenciaDias ?? ANTECEDENCIA_PADRAO_DIAS;
  const limite = config.limite ?? LIMITE_NOTIFICACOES;
  const itens = [];

  for (const e of eventos) {
    if (e.estado === 'atrasado' || e.estado === 'passado') continue;

    const quandoDia = e.hora
      ? new Date(dataComHora(e.data, e.hora).getTime() - MINUTOS_ANTES_DO_EVENTO * 60000)
      : dataComHora(e.data, horaPadrao);
    if (quandoDia > agora) {
      itens.push({
        chave: `${e.chave}|${e.data}|dia`,
        quando: quandoDia,
        titulo: e.titulo,
        corpo: e.hora ? `Hoje às ${e.hora}` : 'É hoje',
        rota: e.rota ?? null,
      });
    }

    const antecedencia = e.antecedenciaDias ?? antecedenciaPadrao;
    if (antecedencia > 0) {
      const quandoAntes = dataComHora(somarDias(e.data, -antecedencia), horaPadrao);
      if (quandoAntes > agora) {
        const complemento = e.hora ? ` às ${e.hora}` : '';
        itens.push({
          chave: `${e.chave}|${e.data}|antes`,
          quando: quandoAntes,
          titulo: e.titulo,
          corpo: antecedencia === 1 ? `Amanhã${complemento}` : `Em ${antecedencia} dias${complemento}`,
          rota: e.rota ?? null,
        });
      }
    }
  }

  return itens.sort((a, b) => a.quando - b.quando || a.chave.localeCompare(b.chave)).slice(0, limite);
}

/** Dias entre hoje e a data (para montar textos). */
export function diasAte(dataISO, hojeISO) {
  return diferencaEmDias(hojeISO, dataISO);
}
