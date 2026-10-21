import { diferencaEmDias, formatarDataCurta, somarDias } from '../utils/datas';

/** Cuidados periódicos (banho, tosa, antipulgas...). Funções puras. */

/** Sugestões de cuidados com o intervalo mais comum. O tutor pode ajustar ou criar os próprios. */
export const CATALOGO_CUIDADOS = [
  { nome: 'Banho', intervaloDias: 15, icone: 'water-outline' },
  { nome: 'Tosa', intervaloDias: 60, icone: 'cut-outline' },
  { nome: 'Antipulgas', intervaloDias: 30, icone: 'bug-outline' },
  { nome: 'Vermífugo', intervaloDias: 90, icone: 'medical-outline' },
  { nome: 'Corte de unhas', intervaloDias: 30, icone: 'sparkles-outline' },
  { nome: 'Limpeza de ouvido', intervaloDias: 30, icone: 'ear-outline' },
  { nome: 'Escovação de dentes', intervaloDias: 7, icone: 'happy-outline' },
];

export const ICONE_PADRAO = 'sparkles-outline';

/** Quantos dias antes da data o cuidado passa a "vence em breve": 20% do intervalo, entre 2 e 7 dias. */
export function janelaAviso(intervaloDias) {
  if (!intervaloDias) return 0;
  return Math.min(7, Math.max(2, Math.round(intervaloDias * 0.2)));
}

/** Registros já feitos (de hoje para trás), do mais recente ao mais antigo. */
export function feitos(registros, hojeISO) {
  return registros.filter((r) => r.data <= hojeISO).sort((a, b) => (a.data < b.data ? 1 : -1));
}

/** Registros agendados (depois de hoje), do mais próximo ao mais distante. */
export function agendados(registros, hojeISO) {
  return registros.filter((r) => r.data > hojeISO).sort((a, b) => (a.data < b.data ? -1 : 1));
}

/**
 * Próxima data do cuidado: o agendamento mais próximo ou, sem agendamento,
 * o último feito mais o intervalo. Sem nenhum dos dois, não há previsão.
 */
export function proximoCuidado(tipo, registros, hojeISO) {
  const ag = agendados(registros, hojeISO);
  if (ag.length > 0) return ag[0].data;
  const f = feitos(registros, hojeISO);
  if (f.length > 0 && tipo.intervaloDias) return somarDias(f[0].data, tipo.intervaloDias);
  return null;
}

/** Mesmos estados da carteirinha: atrasada, em-breve, em-dia e sem-previsao. */
export function situacaoCuidado(tipo, proximaISO, hojeISO) {
  if (!proximaISO) return { estado: 'sem-previsao', dias: null };
  const dias = diferencaEmDias(hojeISO, proximaISO);
  if (dias < 0) return { estado: 'atrasada', dias };
  if (dias <= janelaAviso(tipo.intervaloDias)) return { estado: 'em-breve', dias };
  return { estado: 'em-dia', dias };
}

/** Texto neutro, que serve para cuidados no masculino e no feminino. */
export function textoCuidado({ estado, dias }, temRegistro = true) {
  if (estado === 'atrasada') {
    const n = -dias;
    return `${n} ${n === 1 ? 'dia' : 'dias'} além da data`;
  }
  if (estado === 'sem-previsao') return temRegistro ? 'Sem previsão' : 'Ainda não registrado';
  if (dias === 0) return 'Hoje';
  if (dias === 1) return 'Amanhã';
  return `Em ${dias} dias`;
}

/** "Último: 20 set 2026" ou "". */
export function textoUltimo(registros, hojeISO) {
  const f = feitos(registros, hojeISO);
  return f.length > 0 ? `Último: ${formatarDataCurta(f[0].data)}` : '';
}
