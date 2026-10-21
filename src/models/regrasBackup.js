import { sha256 } from '@noble/hashes/sha2.js';

/**
 * Regras do backup, da ficha do pet e da importação. Funções puras (sem banco nem arquivos).
 *
 * TABELAS descreve cada tabela que pode viajar em um pacote: ordem (pais antes dos filhos),
 * de quem ela depende, quais colunas guardam caminhos de arquivo e a que seção da ficha pertence.
 *  - privada: valores e anotações pessoais. Entram só no backup do próprio tutor, nunca em ficha.
 *  - secao: seção da ficha que inclui a tabela. Sem seção = só no backup completo.
 */
export const TABELAS = [
  { nome: 'tutores', rotulo: ['dados do tutor', 'dados do tutor'], pais: {} },
  { nome: 'pets', rotulo: ['pet', 'pets'], secao: 'basico', pais: {}, arquivos: ['foto_uri'] },
  { nome: 'tipos_vacina', rotulo: ['vacina', 'vacinas'], secao: 'vacinas', pais: { pet_id: 'pets' } },
  {
    nome: 'doses_vacina',
    rotulo: ['dose de vacina', 'doses de vacina'],
    secao: 'vacinas',
    pais: { tipo_id: 'tipos_vacina' },
  },
  { nome: 'registros_peso', rotulo: ['pesagem', 'pesagens'], secao: 'peso', pais: { pet_id: 'pets' } },
  { nome: 'consultas', rotulo: ['consulta', 'consultas'], secao: 'consultas', pais: { pet_id: 'pets' } },
  {
    nome: 'consultas_privadas',
    rotulo: ['valor ou anotação de consulta', 'valores e anotações de consultas'],
    privada: true,
    pais: { consulta_id: 'consultas' },
  },
  {
    nome: 'anexos_consulta',
    rotulo: ['anexo de consulta', 'anexos de consultas'],
    secao: 'consultas',
    pais: { consulta_id: 'consultas' },
    arquivos: ['uri'],
    obrigatorios: ['uri'],
    // Anexos marcados como privados nunca saem em ficha.
    naFicha: (l) => !l.privado,
  },
  {
    nome: 'planos_alimentares',
    rotulo: ['plano de alimentação', 'planos de alimentação'],
    secao: 'alimentacao',
    pais: { pet_id: 'pets' },
  },
  {
    nome: 'refeicoes_registro',
    rotulo: ['refeição registrada', 'refeições registradas'],
    pais: { plano_id: 'planos_alimentares', pet_id: 'pets' },
  },
  { nome: 'passeios', rotulo: ['passeio', 'passeios'], pais: { pet_id: 'pets' } },
  {
    nome: 'marcacoes_passeio',
    rotulo: ['marcação de passeio', 'marcações de passeios'],
    pais: { passeio_id: 'passeios' },
  },
  { nome: 'tipos_cuidado', rotulo: ['cuidado', 'cuidados'], secao: 'cuidados', pais: { pet_id: 'pets' } },
  {
    nome: 'registros_cuidado',
    rotulo: ['cuidado realizado', 'cuidados realizados'],
    secao: 'cuidados',
    pais: { tipo_id: 'tipos_cuidado' },
  },
  {
    nome: 'cuidados_privados',
    rotulo: ['anotação de cuidado', 'anotações de cuidados'],
    privada: true,
    pais: { registro_id: 'registros_cuidado' },
  },
  { nome: 'lembretes_avulsos', rotulo: ['lembrete', 'lembretes'], pais: { pet_id: 'pets' } },
  {
    nome: 'fotos',
    rotulo: ['foto da galeria', 'fotos da galeria'],
    pais: { pet_id: 'pets' },
    arquivos: ['uri', 'thumb_uri'],
    obrigatorios: ['uri'],
  },
  { nome: 'homenagens', rotulo: ['homenagem', 'homenagens'], pais: { pet_id: 'pets' } },
  { nome: 'marcos_memorial', rotulo: ['marco do memorial', 'marcos do memorial'], pais: { pet_id: 'pets' } },
];

const POR_NOME = new Map(TABELAS.map((t) => [t.nome, t]));
export const NOMES_TABELAS = TABELAS.map((t) => t.nome);
export function especDaTabela(nome) {
  return POR_NOME.get(nome) ?? null;
}

/** Seções da ficha. "Dados básicos" (nome, espécie, raça, nascimento, microchip, foto...) sempre entram. */
export const SECOES_FICHA = [
  { chave: 'vacinas', rotulo: 'Vacinas', detalhe: 'Cada vacina com o histórico de doses', padrao: true },
  { chave: 'peso', rotulo: 'Peso', detalhe: 'Histórico de pesagens', padrao: true },
  { chave: 'alimentacao', rotulo: 'Alimentação', detalhe: 'Plano alimentar atual', padrao: true },
  { chave: 'cuidados', rotulo: 'Cuidados', detalhe: 'Banho, tosa e outros cuidados', padrao: true },
  {
    chave: 'consultas',
    rotulo: 'Consultas',
    detalhe: 'Data, motivo, diagnóstico e anexos que não são privados. Valores nunca entram.',
    padrao: false,
  },
];
export const SECOES_PADRAO = SECOES_FICHA.filter((s) => s.padrao).map((s) => s.chave);

/** Colunas que não viajam em ficha (identificam aparelhos). */
const COLUNAS_OCULTAS_FICHA = ['autor_dispositivo_id', 'dono_dispositivo_id'];

export function tabelasDoEscopo(tipo, secoes = []) {
  if (tipo === 'backup') return [...NOMES_TABELAS];
  const ativas = new Set(['basico', ...secoes]);
  return TABELAS.filter((t) => !t.privada && t.secao && ativas.has(t.secao)).map((t) => t.nome);
}

/** Ficha: só os pets escolhidos, só as seções escolhidas, sem registros apagados, privados nem aparelhos. */
export function montarTabelasFicha(todas, petIds, secoes) {
  const dentro = new Set(tabelasDoEscopo('ficha', secoes));
  const idsMantidos = {};
  const saida = {};
  for (const spec of TABELAS) {
    if (!dentro.has(spec.nome)) continue;
    const linhas = (todas[spec.nome] ?? []).filter((l) => {
      if (l.excluido_em) return false;
      if (spec.nome === 'pets') return petIds.includes(l.id);
      if (spec.naFicha && !spec.naFicha(l)) return false;
      return Object.entries(spec.pais).every(([coluna, tabelaPai]) => idsMantidos[tabelaPai]?.has(l[coluna]));
    });
    idsMantidos[spec.nome] = new Set(linhas.map((l) => l.id));
    saida[spec.nome] = linhas.map((l) => {
      const copia = { ...l };
      COLUNAS_OCULTAS_FICHA.forEach((c) => {
        if (c in copia) copia[c] = null;
      });
      return copia;
    });
  }
  return saida;
}

/** Troca caminhos de arquivo por "arquivos/<nome>". Linhas cujo arquivo obrigatório sumiu são omitidas. */
export function referenciarArquivos(tabelas, nomeadorDeArquivo) {
  const saida = {};
  let semArquivo = 0;
  for (const [nome, linhas] of Object.entries(tabelas)) {
    const spec = especDaTabela(nome);
    if (!spec?.arquivos) {
      saida[nome] = linhas;
      continue;
    }
    saida[nome] = [];
    for (const linha of linhas) {
      const nova = { ...linha };
      let descartar = false;
      for (const coluna of spec.arquivos) {
        const uri = linha[coluna];
        if (!uri) continue;
        const ref = nomeadorDeArquivo(uri);
        if (ref) nova[coluna] = ref;
        else if (spec.obrigatorios?.includes(coluna)) descartar = true;
        else nova[coluna] = null;
        if (!ref) semArquivo += 1;
      }
      if (!descartar) saida[nome].push(nova);
    }
  }
  return { tabelas: saida, semArquivo };
}

/**
 * Na importação: só valem referências "arquivos/<nome>" que estejam dentro do pacote.
 * Qualquer outro valor (caminho de outro lugar do aparelho, por exemplo) é descartado.
 * localDoArquivo(ref) devolve o caminho local depois de copiado, ou null se não existe.
 */
export function resolverArquivos(tabelas, localDoArquivo) {
  const saida = {};
  for (const [nome, linhas] of Object.entries(tabelas)) {
    const spec = especDaTabela(nome);
    if (!spec?.arquivos) {
      saida[nome] = linhas;
      continue;
    }
    saida[nome] = [];
    for (const linha of linhas) {
      const nova = { ...linha };
      let descartar = false;
      for (const coluna of spec.arquivos) {
        const ref = linha[coluna];
        if (ref == null || ref === '') continue;
        const local = typeof ref === 'string' && ref.startsWith('arquivos/') ? localDoArquivo(ref) : null;
        if (local) nova[coluna] = local;
        else if (spec.obrigatorios?.includes(coluna)) descartar = true;
        else nova[coluna] = null;
      }
      if (!descartar) saida[nome].push(nova);
    }
  }
  return saida;
}

/** Nome do arquivo dentro do pacote: hash do conteúdo (fotos iguais viram um arquivo só). */
export function nomeNoPacote(bytes, uriOriginal) {
  const hash = Array.from(sha256(bytes).subarray(0, 12), (b) => b.toString(16).padStart(2, '0')).join('');
  const m = /\.([A-Za-z0-9]{2,5})(?:\?.*)?$/.exec(uriOriginal ?? '');
  const ext =
    m && ['jpg', 'jpeg', 'png', 'webp', 'heic', 'gif', 'pdf'].includes(m[1].toLowerCase())
      ? m[1].toLowerCase()
      : 'bin';
  return `arquivos/${hash}.${ext}`;
}

/** Id determinístico de um registro vindo de ficha: importar a mesma ficha duas vezes dá os mesmos ids. */
export function idDeFicha(idOriginal) {
  const h = Array.from(
    sha256(new TextEncoder().encode(`ajudapet-ficha:${idOriginal}`)).subarray(0, 16),
    (b) => b.toString(16).padStart(2, '0'),
  ).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}

/** Ficha recebida vira uma cópia à parte: ids novos (determinísticos), sem aparelhos, pets marcados como "ficha". */
export function prepararFichaRecebida(tabelas) {
  const mapa = new Map();
  const saida = {};
  for (const spec of TABELAS) {
    const linhas = tabelas[spec.nome];
    if (!Array.isArray(linhas)) continue;
    saida[spec.nome] = linhas.map((l) => {
      const nova = { ...l };
      if (typeof l.id === 'string') {
        const novo = idDeFicha(l.id);
        mapa.set(`${spec.nome}:${l.id}`, novo);
        nova.id = novo;
      }
      for (const [coluna, tabelaPai] of Object.entries(spec.pais)) {
        nova[coluna] = mapa.get(`${tabelaPai}:${l[coluna]}`) ?? l[coluna];
      }
      nova.autor_dispositivo_id = null;
      if (spec.nome === 'pets') {
        nova.origem = 'ficha';
        nova.dono_dispositivo_id = null;
      }
      return nova;
    });
  }
  return saida;
}

// ---------------------------------------------------------------------------------------------
// Prévia da importação

const ID_VALIDO = /^[A-Za-z0-9-]{8,64}$/;
const LIMITE_TEXTO = 100000;

function dataValida(s) {
  return typeof s === 'string' && s.length >= 10 && s.length <= 40 && !Number.isNaN(Date.parse(s));
}

/** Motivo da rejeição, ou null se a linha tem o formato esperado. */
export function motivoDeRejeicao(linha) {
  if (!linha || typeof linha !== 'object' || Array.isArray(linha)) return 'registro inválido';
  if (typeof linha.id !== 'string' || !ID_VALIDO.test(linha.id)) return 'identificador inválido';
  if (!dataValida(linha.atualizado_em)) return 'data de alteração inválida';
  if (!dataValida(linha.criado_em)) return 'data de criação inválida';
  for (const valor of Object.values(linha)) {
    if (valor === null) continue;
    if (typeof valor === 'number' && Number.isFinite(valor)) continue;
    if (typeof valor === 'string' && valor.length <= LIMITE_TEXTO) continue;
    return 'valor não aceito';
  }
  return null;
}

/**
 * Compara o que veio no pacote com o que já existe no aparelho.
 * locais: { tabela: Map(id -> { atualizado_em, excluido_em }) }
 * Ações: inserir (novo) | atualizar (o do pacote é mais recente) | igual | manter (o daqui é mais novo) | rejeitar.
 */
export function compararComLocal(tabelas, locais, tipo = 'backup') {
  const permitidas = new Set(
    tabelasDoEscopo(
      tipo,
      SECOES_FICHA.map((s) => s.chave),
    ),
  );
  const decisoes = {};
  const aceitos = {};
  const ignoradas = [];

  for (const nome of Object.keys(tabelas)) {
    if (!POR_NOME.has(nome) || !permitidas.has(nome)) ignoradas.push(nome);
  }

  for (const spec of TABELAS) {
    if (!permitidas.has(spec.nome) || !Array.isArray(tabelas[spec.nome])) continue;
    const locaisDaTabela = locais[spec.nome] ?? new Map();
    const vistos = new Set();
    aceitos[spec.nome] = new Set();
    decisoes[spec.nome] = tabelas[spec.nome].map((linha) => {
      let motivo = motivoDeRejeicao(linha);
      if (!motivo && vistos.has(linha.id)) motivo = 'registro repetido';
      if (!motivo) {
        for (const [coluna, tabelaPai] of Object.entries(spec.pais)) {
          const pai = linha[coluna];
          const existe = locais[tabelaPai]?.has(pai) || aceitos[tabelaPai]?.has(pai);
          if (!existe) {
            motivo = 'o registro principal não está no arquivo nem neste aparelho';
            break;
          }
        }
      }
      if (motivo) return { linha, acao: 'rejeitar', motivo };
      vistos.add(linha.id);

      const local = locaisDaTabela.get(linha.id);
      let acao;
      if (!local) acao = 'inserir';
      else {
        const dif = Date.parse(linha.atualizado_em) - Date.parse(local.atualizado_em);
        acao = dif > 0 ? 'atualizar' : dif < 0 ? 'manter' : 'igual';
      }
      aceitos[spec.nome].add(linha.id);
      return { linha, acao };
    });
  }
  return { decisoes, ignoradas };
}

/** Contadores por tabela e total, no vocabulário da tela. */
export function resumirPrevia(decisoes) {
  const itens = [];
  const total = { novos: 0, alterados: 0, removidos: 0, iguais: 0, mantidos: 0, rejeitados: 0 };
  for (const spec of TABELAS) {
    const lista = decisoes[spec.nome];
    if (!lista) continue;
    const c = { novos: 0, alterados: 0, removidos: 0, iguais: 0, mantidos: 0, rejeitados: 0 };
    for (const { linha, acao } of lista) {
      const apagado = Boolean(linha?.excluido_em);
      if (acao === 'inserir') {
        if (!apagado) c.novos += 1;
      } else if (acao === 'atualizar') {
        if (apagado) c.removidos += 1;
        else c.alterados += 1;
      } else if (acao === 'igual') c.iguais += 1;
      else if (acao === 'manter') c.mantidos += 1;
      else c.rejeitados += 1;
    }
    Object.keys(total).forEach((k) => (total[k] += c[k]));
    itens.push({ tabela: spec.nome, rotulo: spec.rotulo, ...c });
  }
  const mudancas = total.novos + total.alterados + total.removidos;
  return { itens, total, nadaDeNovo: mudancas === 0 };
}

/** Texto curto de um item da prévia, como "2 novas, 1 atualizada". */
export function textoDoItem(item) {
  const partes = [];
  if (item.novos) partes.push(`${item.novos} ${item.novos === 1 ? 'novo' : 'novos'}`);
  if (item.alterados) partes.push(`${item.alterados} ${item.alterados === 1 ? 'atualizado' : 'atualizados'}`);
  if (item.removidos) partes.push(`${item.removidos} ${item.removidos === 1 ? 'removido' : 'removidos'}`);
  if (item.mantidos)
    partes.push(`${item.mantidos} já ${item.mantidos === 1 ? 'está' : 'estão'} mais recentes aqui`);
  if (item.rejeitados) partes.push(`${item.rejeitados} ${item.rejeitados === 1 ? 'recusado' : 'recusados'}`);
  return partes.join(', ');
}

/** Itens que mudam algo (ou foram recusados), para listar na tela. */
export function itensVisiveis(resumo) {
  return resumo.itens.filter((i) => i.novos || i.alterados || i.removidos || i.mantidos || i.rejeitados);
}

/** Pets que aparecem no pacote, com o que vai acontecer com cada um. */
export function petsDaPrevia(decisoes) {
  return (decisoes.pets ?? [])
    .filter((d) => d.acao !== 'rejeitar' && !d.linha.excluido_em)
    .map((d) => ({ id: d.linha.id, nome: String(d.linha.nome ?? ''), acao: d.acao }));
}

/** Só as linhas que precisam ser gravadas, por tabela, na ordem certa. */
export function linhasParaAplicar(decisoes) {
  const saida = [];
  for (const spec of TABELAS) {
    for (const d of decisoes[spec.nome] ?? []) {
      if (d.acao === 'inserir' || d.acao === 'atualizar')
        saida.push({ tabela: spec.nome, acao: d.acao, linha: d.linha });
    }
  }
  return saida;
}

// ---------------------------------------------------------------------------------------------
// Nomes, espaço e lembrete

function doisDigitos(n) {
  return String(n).padStart(2, '0');
}
export function dataParaNome(data) {
  return `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}-${doisDigitos(data.getDate())}`;
}
function slug(texto) {
  const s = String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return s.slice(0, 30) || 'pet';
}
export function nomeDoArquivoDePacote(tipo, data, nomePet) {
  const dia = dataParaNome(data);
  return tipo === 'backup' ? `AjudaPet-backup-${dia}.ajudapet` : `Ficha-${slug(nomePet)}-${dia}.ajudapet`;
}

/** Espaço livre necessário para gerar ou abrir um pacote: o pacote em si, uma cópia temporária e folga. */
export function espacoNecessario(bytesDeArquivos, bytesEstimadosDeDados = 0) {
  return Math.ceil((bytesDeArquivos + bytesEstimadosDeDados) * 2.5) + 5 * 1024 * 1024;
}

export function formatarTamanho(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

/** Mantém só os `manter` backups automáticos mais recentes (o nome carrega a data); devolve os que devem ser apagados. */
export function backupsParaApagar(nomes, manter = 3) {
  return [...nomes].sort().reverse().slice(manter);
}

/** Situação do backup: nunca feito, em dia ou atrasado, conforme o intervalo escolhido (0 = sem lembrete). */
export function situacaoDoBackup(ultimoISO, intervaloDias, hoje = new Date()) {
  const ultimo = ultimoISO && !Number.isNaN(Date.parse(ultimoISO)) ? new Date(ultimoISO) : null;
  if (!ultimo) return { nunca: true, dias: null, devido: intervaloDias > 0 };
  const dias = Math.max(0, Math.floor((hoje.getTime() - ultimo.getTime()) / 86400000));
  return { nunca: false, dias, devido: intervaloDias > 0 && dias >= intervaloDias };
}

export function textoDaSituacao(situacao) {
  if (situacao.nunca) return 'Você ainda não fez backup';
  if (situacao.dias === 0) return 'Último backup: hoje';
  if (situacao.dias === 1) return 'Último backup: ontem';
  return `Último backup: há ${situacao.dias} dias`;
}

/** Quando avisar do próximo backup: no dia em que completa o intervalo, ou amanhã se já passou. null = sem lembrete. */
export function planejarLembreteBackup(ultimoISO, intervaloDias, agora, horaPadrao = '09:00') {
  if (!intervaloDias || intervaloDias <= 0) return null;
  const [h, m] = horaPadrao.split(':').map(Number);
  const base = ultimoISO && !Number.isNaN(Date.parse(ultimoISO)) ? new Date(ultimoISO) : agora;
  let quando = new Date(
    base.getFullYear(),
    base.getMonth(),
    base.getDate() + intervaloDias,
    h || 0,
    m || 0,
    0,
  );
  if (quando <= agora) {
    quando = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + 1, h || 0, m || 0, 0);
  }
  return {
    quando,
    titulo: 'Hora de fazer o backup',
    corpo: 'Guarde uma cópia dos dados dos seus pets fora do celular.',
    rota: { pathname: '/backup', params: {} },
  };
}
