import { unzipSync, zipSync, strFromU8, strToU8 } from 'fflate';
import { ErroPacote } from './ErroPacote';

/**
 * Arquivo .ajudapet = zip com:
 *   cabecalho.json  versão do formato, tipo (backup | ficha), origem, data, resumo
 *   dados.json      { tabelas: { nome: [linhas] } }
 *   arquivos/<nome> fotos e anexos (o banco referencia "arquivos/<nome>")
 */
export const FORMATO = 'ajudapet';
export const VERSAO_FORMATO = 1;
export const TIPOS = ['backup', 'ficha'];
export const EXTENSAO = '.ajudapet';
export const LIMITE_ARQUIVO_BYTES = 40 * 1024 * 1024;
export const LIMITE_TOTAL_BYTES = 800 * 1024 * 1024;
const PADRAO_NOME_ARQUIVO = /^arquivos\/[A-Za-z0-9._-]{1,120}$/;

export function montarPacote({ cabecalho, tabelas, arquivos = new Map() }) {
  const entradas = {
    'cabecalho.json': strToU8(
      JSON.stringify({ formato: FORMATO, versaoFormato: VERSAO_FORMATO, ...cabecalho }),
    ),
    'dados.json': strToU8(JSON.stringify({ tabelas })),
  };
  for (const [nome, bytes] of arquivos) {
    if (!PADRAO_NOME_ARQUIVO.test(nome)) throw new ErroPacote('ARQUIVO_INVALIDO', nome);
    entradas[nome] = [bytes, { level: 0 }]; // fotos já são JPEG: não adianta comprimir de novo
  }
  return zipSync(entradas, { level: 6 });
}

/** Valida o cabeçalho. Lança ErroPacote se não for um pacote nosso ou se for de uma versão mais nova. */
export function validarCabecalho(c, { versaoEsquemaApp }) {
  if (!c || typeof c !== 'object' || c.formato !== FORMATO) throw new ErroPacote('ARQUIVO_INVALIDO');
  if (!Number.isInteger(c.versaoFormato) || c.versaoFormato < 1) throw new ErroPacote('ARQUIVO_INVALIDO');
  if (c.versaoFormato > VERSAO_FORMATO) throw new ErroPacote('VERSAO_NOVA');
  if (!TIPOS.includes(c.tipo)) throw new ErroPacote('ARQUIVO_INVALIDO');
  if (!Number.isInteger(c.versaoEsquema) || c.versaoEsquema < 1) throw new ErroPacote('ARQUIVO_INVALIDO');
  if (c.versaoEsquema > versaoEsquemaApp) throw new ErroPacote('VERSAO_NOVA');
  if (typeof c.pacoteId !== 'string' || typeof c.geradoEm !== 'string')
    throw new ErroPacote('ARQUIVO_INVALIDO');
  return c;
}

/** Abre o zip, com limites de tamanho, e devolve { cabecalho, tabelas, arquivos }. */
export function lerPacote(bytes, { versaoEsquemaApp }) {
  let total = 0;
  let entradas;
  try {
    entradas = unzipSync(bytes, {
      filter: (arq) => {
        const nome = arq.name;
        const permitido =
          nome === 'cabecalho.json' || nome === 'dados.json' || PADRAO_NOME_ARQUIVO.test(nome);
        if (!permitido) return false; // ignora qualquer outro nome (inclui tentativas de "../")
        if (arq.originalSize > LIMITE_ARQUIVO_BYTES) throw new ErroPacote('MUITO_GRANDE');
        total += arq.originalSize;
        if (total > LIMITE_TOTAL_BYTES) throw new ErroPacote('MUITO_GRANDE');
        return true;
      },
    });
  } catch (e) {
    if (e instanceof ErroPacote) throw e;
    throw new ErroPacote('ARQUIVO_INVALIDO');
  }
  if (!entradas['cabecalho.json'] || !entradas['dados.json']) throw new ErroPacote('ARQUIVO_INVALIDO');

  let cabecalho;
  let dados;
  try {
    cabecalho = JSON.parse(strFromU8(entradas['cabecalho.json']));
    dados = JSON.parse(strFromU8(entradas['dados.json']));
  } catch {
    throw new ErroPacote('CORROMPIDO');
  }
  validarCabecalho(cabecalho, { versaoEsquemaApp });
  const tabelas = dados?.tabelas;
  if (!tabelas || typeof tabelas !== 'object' || Array.isArray(tabelas)) throw new ErroPacote('CORROMPIDO');

  const arquivos = new Map();
  for (const [nome, conteudo] of Object.entries(entradas)) {
    if (nome.startsWith('arquivos/')) arquivos.set(nome, conteudo);
  }
  return { cabecalho, tabelas, arquivos };
}
