import { diferencaEmDias, formatarDataCurta } from '../utils/datas';

/** Consultas: separar o que é futuro do que já aconteceu, descrever "quando" e somar gastos. */

/** Aceita "14:30"; devolve a hora ou um erro. Vazio é válido. */
export function lerHora(texto) {
  const t = texto.trim();
  if (t === '') return { hora: '' };
  const m = /^(\d{2}):(\d{2})$/.exec(t);
  if (!m || Number(m[1]) > 23 || Number(m[2]) > 59)
    return { erro: 'Use o formato hh:mm, por exemplo 14:30.' };
  return { hora: t };
}

/** "1430" vira "14:30" enquanto digita. */
export function mascararHora(texto) {
  const d = texto.replace(/\D/g, '').slice(0, 4);
  return d.length <= 2 ? d : `${d.slice(0, 2)}:${d.slice(2)}`;
}

function ordemCronologica(a, b) {
  if (a.data !== b.data) return a.data < b.data ? -1 : 1;
  return (a.hora || '99:99') < (b.hora || '99:99') ? -1 : 1;
}

/** "14:30" a partir de uma data, para comparar com a hora das consultas. */
export function horaDe(data) {
  return `${String(data.getHours()).padStart(2, '0')}:${String(data.getMinutes()).padStart(2, '0')}`;
}

/**
 * A consulta já aconteceu? Antes de hoje, sim. Hoje, só se tem hora e ela já passou
 * (sem hora não dá para saber, então ela continua como agendada até o fim do dia).
 */
export function jaAconteceu(consulta, hojeISO, horaAgora = '') {
  if (consulta.data < hojeISO) return true;
  if (consulta.data > hojeISO) return false;
  return Boolean(consulta.hora && horaAgora && consulta.hora < horaAgora);
}

/**
 * Separa as consultas: "agendadas" (as que ainda vão acontecer, da mais próxima para a mais
 * distante) e "historico" (as que já aconteceram, da mais recente para a mais antiga).
 */
export function separarConsultas(consultas, hojeISO, horaAgora = '') {
  const passou = (c) => jaAconteceu(c, hojeISO, horaAgora);
  const agendadas = consultas.filter((c) => !passou(c)).sort(ordemCronologica);
  const historico = consultas.filter(passou).sort((a, b) => ordemCronologica(b, a));
  return { proxima: agendadas[0] ?? null, agendadas, historico };
}

/** "Hoje, 14:30", "Amanhã", "Em 5 dias, 10:00" ou "03 set 2026". */
export function textoQuando(consulta, hojeISO) {
  const dias = diferencaEmDias(hojeISO, consulta.data);
  const hora = consulta.hora ? `, ${consulta.hora}` : '';
  if (dias === 0) return `Hoje${hora}`;
  if (dias === 1) return `Amanhã${hora}`;
  if (dias > 1 && dias <= 14) return `Em ${dias} dias${hora}`;
  return `${formatarDataCurta(consulta.data)}${hora}`;
}

/** Soma os valores (centavos) das consultas do ano que já aconteceram. */
export function gastoDoAno(consultas, privadasPorConsulta, ano, hojeISO) {
  return consultas
    .filter((c) => c.data.startsWith(`${ano}-`) && c.data <= hojeISO)
    .reduce((soma, c) => soma + (privadasPorConsulta[c.id]?.valorCentavos ?? 0), 0);
}

export const MOTIVOS_COMUNS = ['Check-up', 'Vacina', 'Retorno', 'Exame', 'Emergência'];
