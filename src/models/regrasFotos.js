import { NOMES_MESES } from '../utils/datas';

/** Galeria de fotos do pet. Funções puras. */

/** Mais fotos de uma vez pela galeria do celular. */
export const LIMITE_FOTOS_POR_VEZ = 10;

/** "Outubro de 2026" a partir de "2026-10". */
export function tituloDoMes(chave) {
  const [ano, mes] = chave.split('-').map(Number);
  const nome = NOMES_MESES[mes - 1];
  return `${nome.charAt(0).toUpperCase()}${nome.slice(1)} de ${ano}`;
}

/** Fotos agrupadas por mês, do mês mais recente para o mais antigo (e as mais novas primeiro em cada mês). */
export function agruparPorMes(fotos) {
  const mapa = new Map();
  const ordenadas = [...fotos].sort((a, b) =>
    a.data === b.data ? (a.criadoEm < b.criadoEm ? 1 : -1) : a.data < b.data ? 1 : -1,
  );
  for (const f of ordenadas) {
    const chave = f.data.slice(0, 7);
    if (!mapa.has(chave)) mapa.set(chave, []);
    mapa.get(chave).push(f);
  }
  return [...mapa.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([chave, lista]) => ({ chave, titulo: tituloDoMes(chave), fotos: lista }));
}

/** "Nenhuma foto", "1 foto" ou "86 fotos". */
export function contarFotos(n) {
  if (n === 0) return 'Nenhuma foto';
  return `${n} ${n === 1 ? 'foto' : 'fotos'}`;
}

/** "1 selecionada" ou "3 selecionadas". */
export function contarSelecionadas(n) {
  return `${n} ${n === 1 ? 'selecionada' : 'selecionadas'}`;
}

/** Largura de cada quadradinho da grade, dadas a largura disponível, as colunas e o espaço entre eles. */
export function tamanhoDoQuadrado(larguraTotal, colunas = 3, espaco = 4) {
  if (larguraTotal <= 0) return 0;
  return Math.floor((larguraTotal - espaco * (colunas - 1)) / colunas);
}
