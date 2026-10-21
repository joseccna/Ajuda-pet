import { xchacha20poly1305 } from '@noble/ciphers/chacha.js';
import { scryptAsync } from '@noble/hashes/scrypt.js';
import { ErroPacote } from './ErroPacote';

/**
 * Proteção por senha de um pacote inteiro.
 *
 * Arquivo protegido = "AJPETENC" + versão(1) + log2(N)(1) + r(1) + p(1) + sal(16) + nonce(24) + texto cifrado.
 * Chave derivada da senha com scrypt; cifra XChaCha20-Poly1305 (autenticada: senha errada ou arquivo
 * alterado são detectados). Os parâmetros do scrypt ficam no arquivo, então podem mudar no futuro.
 * Não há como recuperar o conteúdo se a senha for esquecida.
 */
const MAGIA = [0x41, 0x4a, 0x50, 0x45, 0x54, 0x45, 0x4e, 0x43]; // "AJPETENC"
const VERSAO = 1;
const TAM_SAL = 16;
const TAM_NONCE = 24;
const TAM_CABECALHO = MAGIA.length + 4 + TAM_SAL + TAM_NONCE;
const LOG_N_PADRAO = 14;
const LOG_N_MAXIMO = 17; // limite para um arquivo malicioso não travar o aparelho
const R = 8;
const P = 1;

export function ehCifrado(bytes) {
  return bytes.length >= MAGIA.length && MAGIA.every((b, i) => bytes[i] === b);
}

async function derivarChave(senha, sal, logN, r, p) {
  const entrada = new TextEncoder().encode(senha.normalize('NFC'));
  return scryptAsync(entrada, sal, { N: 2 ** logN, r, p, dkLen: 32, maxmem: 160 * 1024 * 1024 });
}

/** @param aleatorio função (n) => Uint8Array com n bytes aleatórios seguros (no app, a do expo-crypto). */
export async function cifrar(bytes, senha, aleatorio, logN = LOG_N_PADRAO) {
  if (!senha) throw new ErroPacote('SENHA_NECESSARIA');
  const sal = aleatorio(TAM_SAL);
  const nonce = aleatorio(TAM_NONCE);
  const chave = await derivarChave(senha, sal, logN, R, P);
  const cifrado = xchacha20poly1305(chave, nonce).encrypt(bytes);
  const saida = new Uint8Array(TAM_CABECALHO + cifrado.length);
  saida.set(MAGIA, 0);
  saida.set([VERSAO, logN, R, P], MAGIA.length);
  saida.set(sal, MAGIA.length + 4);
  saida.set(nonce, MAGIA.length + 4 + TAM_SAL);
  saida.set(cifrado, TAM_CABECALHO);
  return saida;
}

export async function decifrar(bytes, senha) {
  if (!ehCifrado(bytes)) throw new ErroPacote('ARQUIVO_INVALIDO');
  if (bytes.length < TAM_CABECALHO + 16) throw new ErroPacote('CORROMPIDO');
  if (!senha) throw new ErroPacote('SENHA_NECESSARIA');
  const [versao, logN, r, p] = bytes.subarray(MAGIA.length, MAGIA.length + 4);
  if (versao > VERSAO) throw new ErroPacote('VERSAO_NOVA');
  if (logN < 10 || logN > LOG_N_MAXIMO || r < 1 || r > 16 || p < 1 || p > 4) {
    throw new ErroPacote('CORROMPIDO');
  }
  const sal = bytes.subarray(MAGIA.length + 4, MAGIA.length + 4 + TAM_SAL);
  const nonce = bytes.subarray(MAGIA.length + 4 + TAM_SAL, TAM_CABECALHO);
  const chave = await derivarChave(senha, sal, logN, r, p);
  try {
    return xchacha20poly1305(chave, nonce).decrypt(bytes.subarray(TAM_CABECALHO));
  } catch {
    throw new ErroPacote('SENHA_INCORRETA');
  }
}

/** Regras de senha para proteger um backup. */
export const SENHA_MINIMA = 6;
export function validarSenha(senha, confirmacao) {
  if (!senha || senha.length < SENHA_MINIMA) return `Use pelo menos ${SENHA_MINIMA} caracteres.`;
  if (senha !== confirmacao) return 'As senhas não são iguais.';
  return null;
}
