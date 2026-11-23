import { dataAproximada, formatarDataBR, idadeEmMeses, lerDataBR } from './datas';
export const nascimentoVazio = { modo: 'exata', texto: '', anos: '', meses: '' };
/**
 * Campo do formulário a partir do pet salvo. Nascimento aproximado volta como idade (anos e
 * meses) e guarda a data original: se o usuário não mexer na idade, a data e o indicador de
 * "aproximado" ficam como estavam.
 */
export function nascimentoDoPet(iso, aproximada, hoje = new Date()) {
  if (!iso) return nascimentoVazio;
  const texto = formatarDataBR(iso);
  if (!aproximada) return { modo: 'exata', texto, anos: '', meses: '' };
  const total = idadeEmMeses(iso, hoje);
  const anos = String(Math.floor(total / 12));
  const meses = String(total % 12);
  return { modo: 'aproximada', texto, anos, meses, original: { iso, anos, meses } };
}

/** Converte o que o usuário digitou em uma data ISO (ou em erro). Campo vazio é válido. */
export function resolverNascimento(campo, hoje = new Date()) {
  if (campo.modo === 'exata') {
    if (campo.texto.trim() === '') return { iso: null, aproximada: false };
    const r = lerDataBR(campo.texto, hoje);
    if ('erro' in r) return { iso: null, aproximada: false, erro: r.erro };
    return { iso: r.iso, aproximada: false };
  }
  if (campo.anos.trim() === '' && campo.meses.trim() === '') return { iso: null, aproximada: false };
  const anos = campo.anos.trim() === '' ? 0 : Number(campo.anos);
  const meses = campo.meses.trim() === '' ? 0 : Number(campo.meses);
  if (
    !Number.isInteger(anos) ||
    !Number.isInteger(meses) ||
    anos < 0 ||
    meses < 0 ||
    meses > 11 ||
    anos > 40
  ) {
    return { iso: null, aproximada: true, erro: 'Informe anos (0 a 40) e meses (0 a 11).' };
  }
  const o = campo.original;
  if (o && campo.anos.trim() === o.anos && campo.meses.trim() === o.meses) {
    return { iso: o.iso, aproximada: true };
  }
  return { iso: dataAproximada(anos, meses, hoje), aproximada: true };
}
