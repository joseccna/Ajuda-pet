/**
 * Dinheiro: guardado em centavos (inteiro) e mostrado como "R$ 1.280,00".
 */

/** "280", "280,5", "1.280,00" ou "R$ 280,00" em centavos. Vazio é válido e vira null. */
export function lerReais(texto) {
  const limpo = texto.replace(/R\$/gi, '').replace(/\s/g, '');
  if (limpo === '') return { centavos: null };
  // Ponto como milhar e vírgula como decimal ("1.280,50"); aceita também "1280.50".
  const normal = limpo.includes(',') ? limpo.replace(/\./g, '').replace(',', '.') : limpo;
  if (!/^\d+(\.\d{1,2})?$/.test(normal)) return { erro: 'Use só números, por exemplo 280,00.' };
  const centavos = Math.round(Number(normal) * 100);
  if (centavos > 100000000) return { erro: 'Esse valor parece alto demais.' };
  return { centavos };
}

/** 128000 em "R$ 1.280,00". */
export function formatarReais(centavos) {
  if (centavos === null || centavos === undefined) return '';
  const reais = Math.floor(centavos / 100);
  const resto = String(centavos % 100).padStart(2, '0');
  const milhar = String(reais).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `R$ ${milhar},${resto}`;
}

/** 28000 em "280,00", para preencher um campo de edição. */
export function centavosParaCampo(centavos) {
  if (centavos === null || centavos === undefined) return '';
  return `${Math.floor(centavos / 100)},${String(centavos % 100).padStart(2, '0')}`;
}
