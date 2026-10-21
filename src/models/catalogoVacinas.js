/**
 * Vacinas comuns por espécie, com o intervalo de reforço mais usado.
 * São sugestões para facilitar o cadastro: quem define o calendário do pet é o veterinário.
 * intervaloDias: null significa "sem reforço previsto".
 */
export const CATALOGO_VACINAS = {
  cachorro: [
    { nome: 'V8', intervaloDias: 365 },
    { nome: 'V10', intervaloDias: 365 },
    { nome: 'Antirrábica', intervaloDias: 365 },
    { nome: 'Gripe canina', intervaloDias: 365 },
    { nome: 'Giárdia', intervaloDias: 365 },
    { nome: 'Leishmaniose', intervaloDias: 365 },
  ],
  gato: [
    { nome: 'V3', intervaloDias: 365 },
    { nome: 'V4', intervaloDias: 365 },
    { nome: 'V5', intervaloDias: 365 },
    { nome: 'Antirrábica', intervaloDias: 365 },
    { nome: 'Leucemia felina (FeLV)', intervaloDias: 365 },
  ],
  outro: [{ nome: 'Antirrábica', intervaloDias: 365 }],
};

export function sugestoesPara(especie) {
  return CATALOGO_VACINAS[especie] ?? CATALOGO_VACINAS.outro;
}

/** "a cada 1 ano", "a cada 6 meses", "sem reforço"... */
export function descreverIntervalo(dias) {
  if (!dias) return 'Sem reforço previsto';
  if (dias % 365 === 0) {
    const anos = dias / 365;
    return `Reforço a cada ${anos} ${anos === 1 ? 'ano' : 'anos'}`;
  }
  if (dias % 30 === 0) {
    const meses = dias / 30;
    return `Reforço a cada ${meses} ${meses === 1 ? 'mês' : 'meses'}`;
  }
  return `Reforço a cada ${dias} dias`;
}
