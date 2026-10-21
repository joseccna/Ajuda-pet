import { lerHora } from './regrasConsulta';

/** Preferências do tutor: valores padrão, validação e a lista de atalhos do painel. Funções puras. */

export const TEMAS = ['automatico', 'claro', 'escuro'];
export const UNIDADES_PESO = ['automatica', 'kg', 'g'];
export const ANTECEDENCIAS_DIAS = [0, 1, 3, 7];
/** De quantos em quantos dias lembrar do backup (0 = não lembrar). */
export const INTERVALOS_LEMBRETE_BACKUP = [0, 15, 30, 60];
export const META_PASSEIO_MIN_MINIMA = 5;
export const META_PASSEIO_MIN_MAXIMA = 600;

/** Atalhos possíveis do painel, com o texto e o ícone de cada um. */
export const ATALHOS_INFO = {
  passeio: { rotulo: 'Iniciar passeio', icone: 'timer-outline' },
  peso: { rotulo: 'Registrar peso', icone: 'scale-outline' },
  dose: { rotulo: 'Registrar dose', icone: 'shield-checkmark-outline' },
  cuidado: { rotulo: 'Adicionar cuidado', icone: 'sparkles-outline' },
  consulta: { rotulo: 'Agendar consulta', icone: 'medkit-outline' },
  novoPet: { rotulo: 'Adicionar pet', icone: 'add-circle-outline' },
};
export const ATALHOS_DISPONIVEIS = Object.keys(ATALHOS_INFO);

export const PADROES = {
  tema: 'automatico',
  unidadePeso: 'automatica',
  horarioPadrao: '09:00',
  antecedenciaDias: 3,
  metaPasseioMin: 30,
  sugerirPesagem: true,
  atalhos: [...ATALHOS_DISPONIVEIS],
  lembreteBackupDias: 30,
  ultimoBackupEm: null,
};

/** Lista de atalhos sem repetidos nem chaves desconhecidas; se ficar vazia, volta ao padrão. */
export function normalizarAtalhos(lista) {
  const limpa = [...new Set((lista ?? []).filter((c) => ATALHOS_DISPONIVEIS.includes(c)))];
  return limpa.length > 0 ? limpa : [...PADROES.atalhos];
}

/** Completa e corrige o que vier: valores inválidos voltam ao padrão. Sempre devolve preferências completas. */
export function normalizar(entrada = {}) {
  const inteiro = (v) => (Number.isInteger(Number(v)) && v !== '' && v !== null ? Number(v) : NaN);
  const antecedencia = inteiro(entrada.antecedenciaDias);
  const meta = inteiro(entrada.metaPasseioMin);

  return {
    tema: TEMAS.includes(entrada.tema) ? entrada.tema : PADROES.tema,
    unidadePeso: UNIDADES_PESO.includes(entrada.unidadePeso) ? entrada.unidadePeso : PADROES.unidadePeso,
    horarioPadrao:
      'hora' in lerHora(entrada.horarioPadrao ?? '') && entrada.horarioPadrao
        ? entrada.horarioPadrao
        : PADROES.horarioPadrao,
    antecedenciaDias: antecedencia >= 0 && antecedencia <= 30 ? antecedencia : PADROES.antecedenciaDias,
    metaPasseioMin:
      meta >= META_PASSEIO_MIN_MINIMA && meta <= META_PASSEIO_MIN_MAXIMA ? meta : PADROES.metaPasseioMin,
    sugerirPesagem:
      typeof entrada.sugerirPesagem === 'boolean' ? entrada.sugerirPesagem : PADROES.sugerirPesagem,
    atalhos: normalizarAtalhos(entrada.atalhos),
    lembreteBackupDias:
      INTERVALOS_LEMBRETE_BACKUP.includes(Number(entrada.lembreteBackupDias)) &&
      entrada.lembreteBackupDias !== '' &&
      entrada.lembreteBackupDias !== null
        ? Number(entrada.lembreteBackupDias)
        : PADROES.lembreteBackupDias,
    ultimoBackupEm:
      typeof entrada.ultimoBackupEm === 'string' && !Number.isNaN(Date.parse(entrada.ultimoBackupEm))
        ? entrada.ultimoBackupEm
        : null,
  };
}

/** Meta de passeio digitada em minutos. */
export function lerMeta(texto) {
  const t = texto.trim();
  if (!/^\d+$/.test(t)) return { erro: 'Informe os minutos, por exemplo 30.' };
  const n = Number(t);
  if (n < META_PASSEIO_MIN_MINIMA || n > META_PASSEIO_MIN_MAXIMA) {
    return { erro: `Use de ${META_PASSEIO_MIN_MINIMA} a ${META_PASSEIO_MIN_MAXIMA} minutos.` };
  }
  return { minutos: n };
}

/** Horário padrão digitado (hh:mm). */
export function lerHorarioPadrao(texto) {
  const r = lerHora(texto);
  if ('erro' in r || r.hora === '') return { erro: 'Use o formato hh:mm, por exemplo 09:00.' };
  return { horario: r.hora };
}

export function atalhosParaTexto(lista) {
  return lista.join(',');
}

export function atalhosDeTexto(texto) {
  return texto ? texto.split(',').filter(Boolean) : [];
}

/** Todos os atalhos: os ativos na ordem escolhida, depois os desligados na ordem padrão. */
export function listaCompletaDeAtalhos(ativos) {
  const ligados = normalizarAtalhos(ativos);
  const desligados = ATALHOS_DISPONIVEIS.filter((c) => !ligados.includes(c));
  return [
    ...ligados.map((chave) => ({ chave, ativo: true })),
    ...desligados.map((chave) => ({ chave, ativo: false })),
  ];
}

/** Liga ou desliga um atalho. Não deixa desligar o último. */
export function alternarAtalho(ativos, chave) {
  if (ativos.includes(chave)) return ativos.length > 1 ? ativos.filter((c) => c !== chave) : ativos;
  return [...ativos, chave];
}

/** Sobe (delta -1) ou desce (delta +1) um atalho ativo. */
export function moverAtalho(ativos, chave, delta) {
  const i = ativos.indexOf(chave);
  const j = i + delta;
  if (i < 0 || j < 0 || j >= ativos.length) return ativos;
  const nova = [...ativos];
  [nova[i], nova[j]] = [nova[j], nova[i]];
  return nova;
}
