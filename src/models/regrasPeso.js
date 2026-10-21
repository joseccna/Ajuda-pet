import { diferencaEmDias, deISO, paraISO, somarDias } from '../utils/datas';

/** Peso guardado em gramas (inteiro). Estas funções convertem, formatam e analisam. */

const PESO_MIN_G = 5;
const PESO_MAX_G = 200000;

/** Salto entre duas pesagens que merece uma confirmação ("Confere?"). */
export const LIMITE_SALTO = 0.2;
/** Variação que merece um aviso neutro, e a janela em que ela é medida. */
export const LIMITE_VARIACAO = 0.1;
export const JANELA_VARIACAO_DIAS = 60;
/** Dias sem pesar até o app sugerir uma nova pesagem. */
export const DIAS_SEM_PESAR = 30;

export const PERIODOS = [
  { valor: '3m', rotulo: '3 meses', dias: 92 },
  { valor: '6m', rotulo: '6 meses', dias: 183 },
  { valor: '1a', rotulo: '1 ano', dias: 366 },
  { valor: 'tudo', rotulo: 'Tudo', dias: null },
];

/** "28,4" com unidade kg ou g em gramas. */
export function lerPeso(texto, unidade) {
  const limpo = texto.trim().replace(',', '.');
  if (limpo === '' || !/^\d+(\.\d+)?$/.test(limpo)) return { erro: 'Informe o peso, por exemplo 28,4.' };
  const gramas = Math.round(Number(limpo) * (unidade === 'kg' ? 1000 : 1));
  if (gramas < PESO_MIN_G || gramas > PESO_MAX_G)
    return { erro: 'Esse peso parece fora do comum. Confira o valor.' };
  return { gramas };
}

function numeroBR(n, casas) {
  const arredondado = Math.round(n * 10 ** casas) / 10 ** casas;
  return String(arredondado).replace('.', ',');
}

/**
 * Peso para mostrar, na unidade escolhida nas preferências:
 * "automatica" usa gramas abaixo de 1 kg e quilos acima (28400 em "28,4 kg"; 350 em "350 g"),
 * "kg" sempre em quilos ("0,35 kg") e "g" sempre em gramas ("28400 g").
 */
export function formatarPeso(gramas, unidade = 'automatica') {
  if (gramas === null || gramas === undefined) return '';
  if (unidade === 'g') return `${gramas} g`;
  if (unidade === 'kg') return `${numeroBR(gramas / 1000, 3)} kg`;
  if (gramas < 1000) return `${gramas} g`;
  return `${numeroBR(gramas / 1000, 2)} kg`;
}

/** Diferença com sinal: "+0,3 kg", "-200 g" ou "Sem mudança". */
export function formatarDiferenca(gramas, unidade = 'automatica') {
  if (gramas === 0) return 'Sem mudança';
  const sinal = gramas > 0 ? '+' : '-';
  return `${sinal}${formatarPeso(Math.abs(gramas), unidade)}`;
}

/** Registros do período, do mais antigo para o mais recente (a ordem do gráfico). */
export function filtrarPeriodo(registros, periodo, hojeISO) {
  const cfg = PERIODOS.find((p) => p.valor === periodo) ?? PERIODOS[1];
  const corte = cfg.dias === null ? null : somarDias(hojeISO, -cfg.dias);
  return registros
    .filter((r) => r.data <= hojeISO && (corte === null || r.data >= corte))
    .sort((a, b) => (a.data === b.data ? (a.criadoEm < b.criadoEm ? -1 : 1) : a.data < b.data ? -1 : 1));
}

/** Variação em gramas entre o primeiro e o último ponto da série (null se houver menos de dois). */
export function variacaoDaSerie(serie) {
  if (serie.length < 2) return null;
  return serie[serie.length - 1].pesoG - serie[0].pesoG;
}

/** A nova pesagem se afasta muito da última? Serve para perguntar "Confere?". */
export function saltoSuspeito(ultimoG, novoG) {
  if (!ultimoG) return false;
  return Math.abs(novoG - ultimoG) / ultimoG > LIMITE_SALTO;
}

/**
 * Aviso neutro de variação grande: peso mudou 10% ou mais na janela de 60 dias.
 * Não vale para filhotes (menos de 12 meses), que crescem rápido.
 */
export function temVariacaoRelevante(registros, hojeISO, idadeEmMeses) {
  if (idadeEmMeses !== null && idadeEmMeses < 12) return false;
  const corte = somarDias(hojeISO, -JANELA_VARIACAO_DIAS);
  const janela = registros
    .filter((r) => r.data >= corte && r.data <= hojeISO)
    .sort((a, b) => (a.data < b.data ? -1 : 1));
  if (janela.length < 2) return false;
  const primeiro = janela[0].pesoG;
  const ultimo = janela[janela.length - 1].pesoG;
  return Math.abs(ultimo - primeiro) / primeiro >= LIMITE_VARIACAO;
}

/** Dias desde a última pesagem (null se nunca pesou). */
export function diasDesdeUltima(registros, hojeISO) {
  const datas = registros
    .filter((r) => r.data <= hojeISO)
    .map((r) => r.data)
    .sort();
  if (datas.length === 0) return null;
  return diferencaEmDias(datas[datas.length - 1], hojeISO);
}

/**
 * Posição dos pontos do gráfico. Devolve pontos em pixels, uma linha em texto
 * ("x,y x,y") e os valores mínimo e máximo usados na escala.
 */
export function calcularPontos(serie, largura, altura, margem = { topo: 28, base: 28, lados: 24 }) {
  if (serie.length === 0) return { pontos: [], linha: '', min: 0, max: 0 };
  const pesos = serie.map((p) => p.pesoG);
  let min = Math.min(...pesos);
  let max = Math.max(...pesos);
  if (min === max) {
    // Um peso só (ou todos iguais): abre uma faixa para a linha ficar no meio.
    const folga = Math.max(min * 0.05, 50);
    min -= folga;
    max += folga;
  }
  const folga = (max - min) * 0.15;
  min -= folga;
  max += folga;

  const util = { w: largura - margem.lados * 2, h: altura - margem.topo - margem.base };
  const t0 = deISO(serie[0].data).getTime();
  const t1 = deISO(serie[serie.length - 1].data).getTime();
  const pontos = serie.map((p, i) => {
    const fx =
      serie.length === 1
        ? 0.5
        : t1 === t0
          ? i / (serie.length - 1)
          : (deISO(p.data).getTime() - t0) / (t1 - t0);
    const fy = (p.pesoG - min) / (max - min);
    return {
      x: margem.lados + fx * util.w,
      y: margem.topo + (1 - fy) * util.h,
      pesoG: p.pesoG,
      data: p.data,
    };
  });
  return { pontos, linha: pontos.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '), min, max };
}

/**
 * Quais pontos recebem o rótulo de valor. O primeiro e o último sempre; os do meio só quando
 * têm espaço (pelo menos folgaMin pixels do rótulo anterior e do último ponto).
 */
export function escolherRotulos(pontos, folgaMin = 76) {
  const ultimo = pontos.length - 1;
  let anterior = -Infinity;
  return pontos.map((p, i) => {
    if (i === 0 || i === ultimo) {
      anterior = p.x;
      return true;
    }
    if (p.x - anterior >= folgaMin && pontos[ultimo].x - p.x >= folgaMin) {
      anterior = p.x;
      return true;
    }
    return false;
  });
}

export function hojeComoISO(hoje = new Date()) {
  return paraISO(hoje);
}
