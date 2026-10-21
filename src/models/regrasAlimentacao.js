import { diferencaEmDias } from '../utils/datas';

/** Plano alimentar: horários das refeições, ração por dia e estoque. Funções puras. */

/** Quantos minutos antes do horário a refeição pendente já aparece no painel. */
export const MINUTOS_ANTES_LEMBRETE = 60;

/** "08:00" em horário válido ou erro. */
export function lerHorario(texto) {
  const t = texto.trim();
  const m = /^(\d{2}):(\d{2})$/.exec(t);
  if (!m || Number(m[1]) > 23 || Number(m[2]) > 59)
    return { erro: 'Use o formato hh:mm, por exemplo 08:00.' };
  return { horario: t };
}

/** Horários sem repetição e em ordem. */
export function normalizarHorarios(lista) {
  return [...new Set(lista)].sort();
}

export function horariosParaTexto(horarios) {
  return horarios.join(',');
}

export function horariosDeTexto(texto) {
  return texto ? texto.split(',').filter(Boolean) : [];
}

/** "Hh:mm" do momento (24 horas), para comparar com os horários das refeições. */
export function horaDoDia(agora) {
  const dois = (n) => String(n).padStart(2, '0');
  return `${dois(agora.getHours())}:${dois(agora.getMinutes())}`;
}

/** Ração por dia, em gramas. */
export function racaoDiariaG(plano) {
  return plano.quantidadeG * plano.horarios.length;
}

/**
 * Quantos dias o saco ainda dura: o total dividido pelo consumo diário, menos os dias
 * desde que foi aberto. Sem saco ou sem data de abertura, não há estimativa (null).
 */
export function diasDeRacao(plano, hojeISO) {
  if (!plano.sacoG || !plano.sacoAbertoEm) return null;
  const diaria = racaoDiariaG(plano);
  if (diaria <= 0) return null;
  const restante = plano.sacoG / diaria - diferencaEmDias(plano.sacoAbertoEm, hojeISO);
  return Math.max(0, Math.floor(restante));
}

/** "Saco de 15 kg, dura cerca de 18 dias" ou "A ração está acabando". */
export function textoEstoque(plano, hojeISO) {
  const dias = diasDeRacao(plano, hojeISO);
  if (dias === null) return '';
  const kg = String(plano.sacoG / 1000).replace('.', ',');
  if (dias === 0) return `Saco de ${kg} kg: a ração está acabando`;
  return `Saco de ${kg} kg, dura cerca de ${dias} ${dias === 1 ? 'dia' : 'dias'}`;
}

/**
 * Refeições de hoje: cada horário do plano, se já foi feita e se o horário já passou.
 * registros: marcações do dia (podem vir de mais de um aparelho; vale a primeira de cada horário).
 */
export function refeicoesDoDia(plano, registros, agora) {
  const hora = horaDoDia(agora);
  return plano.horarios.map((horario) => {
    const registro = registros.find((r) => r.horario === horario) ?? null;
    return { horario, feita: registro !== null, registro, passou: horario < hora };
  });
}

/** Refeições não feitas cujo horário já passou ou chega na próxima hora (candidatas a lembrete). */
export function refeicoesParaLembrar(refeicoes, agora) {
  const fimDoDia = new Date(agora);
  fimDoDia.setHours(23, 59, 0, 0);
  const limite = horaDoDia(
    new Date(Math.min(agora.getTime() + MINUTOS_ANTES_LEMBRETE * 60000, fimDoDia.getTime())),
  );
  return refeicoes.filter((r) => !r.feita && r.horario <= limite);
}
