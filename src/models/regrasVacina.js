import { diferencaEmDias, somarDias } from '../utils/datas';

/** Faltando quantos dias a vacina passa a "vence em breve". */
export const DIAS_AVISO = 30;

/** Ordem de urgência: o que precisa de atenção vem primeiro. */
const ORDEM = { atrasada: 0, 'em-breve': 1, 'em-dia': 2, 'sem-previsao': 3 };

/** Dose mais recente (por data de aplicação). */
export function ultimaDose(doses) {
  if (doses.length === 0) return null;
  return [...doses].sort((a, b) => (a.dataAplicacao < b.dataAplicacao ? 1 : -1))[0];
}

/**
 * Próxima dose = a data ajustada à mão na última dose, ou a data da última dose
 * mais o intervalo do tipo. Sem dose ou sem intervalo, não há previsão.
 */
export function proximaDose(tipo, doses) {
  const ultima = ultimaDose(doses);
  if (!ultima) return null;
  if (ultima.proximaDoseManual) return ultima.proximaDoseManual;
  if (!tipo.intervaloDias) return null;
  return somarDias(ultima.dataAplicacao, tipo.intervaloDias);
}

/** Situação da vacina em relação a hoje. */
export function calcularSituacao(proximaISO, hojeISO) {
  if (!proximaISO) return { estado: 'sem-previsao', dias: null };
  const dias = diferencaEmDias(hojeISO, proximaISO);
  if (dias < 0) return { estado: 'atrasada', dias };
  if (dias <= DIAS_AVISO) return { estado: 'em-breve', dias };
  return { estado: 'em-dia', dias };
}

/** Texto curto e sem tom de cobrança. */
export function textoSituacao({ estado, dias }) {
  if (estado === 'atrasada') {
    const atraso = -dias;
    return `Atrasada, ${atraso} ${atraso === 1 ? 'dia' : 'dias'}`;
  }
  if (estado === 'em-breve') {
    if (dias === 0) return 'Vence hoje';
    if (dias === 1) return 'Vence amanhã';
    return `Vence em ${dias} dias`;
  }
  if (estado === 'em-dia') return 'Em dia';
  return 'Sem previsão';
}

/** Nome sugerido para a próxima dose: 1ª, 2ª, 3ª e depois reforço. */
export function rotuloSugerido(doses) {
  const n = doses.length;
  if (n < 3) return `${n + 1}ª dose`;
  return 'Reforço';
}

/** Ordena cartões da carteirinha: atrasadas, vence em breve, em dia, sem previsão. */
export function compararPorUrgencia(a, b) {
  const porEstado = ORDEM[a.situacao.estado] - ORDEM[b.situacao.estado];
  if (porEstado !== 0) return porEstado;
  if (a.situacao.dias !== null && b.situacao.dias !== null && a.situacao.dias !== b.situacao.dias) {
    return a.situacao.dias - b.situacao.dias;
  }
  return a.tipo.nome.localeCompare(b.tipo.nome, 'pt-BR');
}
