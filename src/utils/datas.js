/**
 * Datas do app: guardadas como texto ISO (aaaa-mm-dd) e mostradas como dd/mm/aaaa.
 * Funções puras, fáceis de testar.
 */
function dois(n) {
  return n < 10 ? `0${n}` : String(n);
}
/** Data local em formato aaaa-mm-dd. */
export function paraISO(data) {
  return `${data.getFullYear()}-${dois(data.getMonth() + 1)}-${dois(data.getDate())}`;
}
/** Converte aaaa-mm-dd em Date local (meio-dia, para evitar saltos de fuso). */
export function deISO(iso) {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d, 12, 0, 0);
}
/** Insere as barras enquanto o usuário digita: "12032022" vira "12/03/2022". */
export function mascararDataBR(texto) {
  const d = texto.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}
/** Valida dd/mm/aaaa. Não aceita data inexistente nem no futuro. */
export function lerDataBR(texto, hoje = new Date(), permitirFuturo = false) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto.trim());
  if (!m) return { erro: 'Use o formato dd/mm/aaaa.' };
  const dia = Number(m[1]);
  const mes = Number(m[2]);
  const ano = Number(m[3]);
  const data = new Date(ano, mes - 1, dia, 12, 0, 0);
  const existe = data.getFullYear() === ano && data.getMonth() === mes - 1 && data.getDate() === dia;
  if (!existe || ano < 1990) return { erro: 'Essa data não existe.' };
  if (!permitirFuturo && paraISO(data) > paraISO(hoje)) return { erro: 'A data não pode ser no futuro.' };
  return { iso: paraISO(data) };
}
/** aaaa-mm-dd em dd/mm/aaaa. */
export function formatarDataBR(iso) {
  if (!iso) return '';
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}
const MESES_ABREV = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
/** aaaa-mm-dd em "12 mar 2022". */
export function formatarDataCurta(iso) {
  if (!iso) return '';
  const [a, m, d] = iso.split('-').map(Number);
  return `${d} ${MESES_ABREV[m - 1]} ${a}`;
}
/** Meses completos entre a data de nascimento e a referência. */
export function idadeEmMeses(nascimentoISO, hoje = new Date()) {
  const n = deISO(nascimentoISO);
  let meses = (hoje.getFullYear() - n.getFullYear()) * 12 + (hoje.getMonth() - n.getMonth());
  if (hoje.getDate() < n.getDate()) meses -= 1;
  return Math.max(meses, 0);
}
/** "4 anos", "8 meses", "Menos de 1 mês". Com data aproximada, começa com "Cerca de". */
export function descreverIdade(nascimentoISO, aproximada = false, hoje = new Date()) {
  if (!nascimentoISO) return 'Idade desconhecida';
  const meses = idadeEmMeses(nascimentoISO, hoje);
  let texto;
  if (meses < 1) {
    texto = 'Menos de 1 mês';
  } else if (meses < 12) {
    texto = `${meses} ${meses === 1 ? 'mês' : 'meses'}`;
  } else {
    const anos = Math.floor(meses / 12);
    texto = `${anos} ${anos === 1 ? 'ano' : 'anos'}`;
  }
  if (aproximada && meses >= 1) return `Cerca de ${texto.charAt(0).toLowerCase()}${texto.slice(1)}`;
  return texto;
}
/** Data estimada de nascimento a partir de anos e meses de idade. */
export function dataAproximada(anos, meses, hoje = new Date()) {
  const total = anos * 12 + meses;
  const d = new Date(hoje.getFullYear(), hoje.getMonth() - total, 1, 12, 0, 0);
  const ultimoDia = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(hoje.getDate(), ultimoDia));
  return paraISO(d);
}

/** Soma (ou subtrai) dias a uma data ISO. */
export function somarDias(iso, dias) {
  const d = deISO(iso);
  d.setDate(d.getDate() + dias);
  return paraISO(d);
}

/** Quantos dias de uma data até a outra. Positivo se a segunda é depois da primeira. */
export function diferencaEmDias(deIso, ateIso) {
  return Math.round((deISO(ateIso) - deISO(deIso)) / 86400000);
}

/** "Bom dia", "Boa tarde" ou "Boa noite" conforme a hora. */
export function saudacao(hora) {
  if (hora < 5) return 'Boa noite';
  if (hora < 12) return 'Bom dia';
  if (hora < 18) return 'Boa tarde';
  return 'Boa noite';
}

export const NOMES_MESES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

export const NOMES_DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

/** Soma (ou subtrai) meses. Se o dia não existir no mês de destino, usa o último dia dele. */
export function somarMeses(iso, meses) {
  const [a, m, d] = iso.split('-').map(Number);
  const alvo = new Date(a, m - 1 + meses, 1, 12, 0, 0);
  const ultimoDia = new Date(alvo.getFullYear(), alvo.getMonth() + 1, 0).getDate();
  alvo.setDate(Math.min(d, ultimoDia));
  return paraISO(alvo);
}

/** "Sexta, 2 de outubro". */
export function tituloDoDia(iso) {
  const d = deISO(iso);
  const dia = NOMES_DIAS[d.getDay()];
  return `${dia.charAt(0).toUpperCase()}${dia.slice(1)}, ${d.getDate()} de ${NOMES_MESES[d.getMonth()]}`;
}
