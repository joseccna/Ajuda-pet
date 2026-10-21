import { deISO, formatarDataCurta, idadeEmMeses, paraISO } from '../utils/datas';

/** Memorial: o texto sobre a vida do pet, a linha do tempo e a validação da despedida. Funções puras. */

export const LIMITE_HOMENAGEM = 1500;

/** "2012 a 2025, 13 anos de vida". Sem nascimento, "Despedida em 14 mar 2025". Sem nada, vazio. */
export function descreverVida(pet) {
  if (pet.nascimento && pet.dataFalecimento) {
    const meses = idadeEmMeses(pet.nascimento, deISO(pet.dataFalecimento));
    const anos = Math.floor(meses / 12);
    const aproximado = pet.nascimentoAproximado ? 'cerca de ' : '';
    const duracao =
      meses < 1
        ? 'menos de 1 mês'
        : meses < 12
          ? `${meses} ${meses === 1 ? 'mês' : 'meses'}`
          : `${anos} ${anos === 1 ? 'ano' : 'anos'}`;
    const anoNasc = pet.nascimento.slice(0, 4);
    const anoFim = pet.dataFalecimento.slice(0, 4);
    return anoNasc === anoFim
      ? `${anoNasc}, ${aproximado}${duracao} de vida`
      : `${anoNasc} a ${anoFim}, ${aproximado}${duracao} de vida`;
  }
  if (pet.dataFalecimento) return `Despedida em ${formatarDataCurta(pet.dataFalecimento)}`;
  return '';
}

/** A data da despedida é obrigatória, não pode ser no futuro nem antes do nascimento. */
export function validarDespedida({ dataISO, nascimento }, hoje = new Date()) {
  const erros = {};
  if (!dataISO) erros.data = 'Informe a data da despedida.';
  else if (dataISO > paraISO(hoje)) erros.data = 'A data não pode ser no futuro.';
  else if (nascimento && dataISO < nascimento) erros.data = 'A data não pode ser antes do nascimento.';
  return erros;
}

/** Texto da homenagem: opcional, com limite de tamanho. */
export function validarHomenagem(texto) {
  if (texto.length > LIMITE_HOMENAGEM) return { texto: `Use até ${LIMITE_HOMENAGEM} letras.` };
  return {};
}

/** Marcos com data em ordem cronológica; os sem data ficam no fim, na ordem em que foram criados. */
export function ordenarMarcos(marcos) {
  const comData = marcos
    .filter((m) => m.data)
    .sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : a.criadoEm < b.criadoEm ? -1 : 1));
  const semData = marcos.filter((m) => !m.data).sort((a, b) => (a.criadoEm < b.criadoEm ? -1 : 1));
  return [...comData, ...semData];
}

/** Texto para compartilhar a homenagem. */
export function textoParaCompartilhar(pet, homenagem) {
  return [pet.nome, descreverVida(pet), homenagem ? `\n${homenagem}` : ''].filter((x) => x !== '').join('\n');
}
