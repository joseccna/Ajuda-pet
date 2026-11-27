import { paraISO } from '../utils/datas';

/**
 * Liga os lembretes da Agenda aos registros do pet: vacina, cuidado, consulta e passeio têm um
 * lugar próprio no app (carteirinha, cuidados da Rotina, consultas da Saúde, passeios da Rotina).
 * Funções puras.
 */

/** Sem acento e em minúsculas, para comparar "Vermífugo" com "vermifugo". */
function normalizar(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * O tipo (vacina ou cuidado) cujo nome aparece no título do lembrete; o nome mais longo ganha
 * ("V10" e não "V1"). Sem nenhum no título, tenta os nomes de reserva (ex.: banho e tosa).
 */
export function tipoPeloTitulo(titulo, tipos, reservas = []) {
  const t = normalizar(titulo);
  const achados = tipos
    .filter((tipo) => normalizar(tipo.nome) && t.includes(normalizar(tipo.nome)))
    .sort((a, b) => normalizar(b.nome).length - normalizar(a.nome).length);
  if (achados.length > 0) return achados[0];
  for (const nome of reservas) {
    const tipo = tipos.find((x) => normalizar(x.nome) === nome);
    if (tipo) return tipo;
  }
  return null;
}

/**
 * Para onde levar quem marcou o lembrete como feito, para registrar no pet. null quando o tipo
 * não tem registro próprio (medicação).
 * hoje: aaaa-mm-dd; um passeio não pode ficar com data depois de hoje.
 * @returns {{ pathname: string, params: object, rotulo: string, onde: string } | null}
 */
export function registroDoLembrete(lembrete, { vacinas = [], cuidados = [], hoje = paraISO(new Date()) } = {}) {
  const id = lembrete.petId;
  if (lembrete.tipo === 'vacina') {
    const tipo = tipoPeloTitulo(lembrete.titulo, vacinas);
    return {
      pathname: '/pet/[id]/dose',
      params: tipo ? { id, tipoId: tipo.id } : { id },
      rotulo: 'Registrar a dose',
      onde: tipo ? `a dose da ${tipo.nome} na carteirinha` : 'a dose na carteirinha de vacinas',
    };
  }
  if (lembrete.tipo === 'banho' || lembrete.tipo === 'cuidado') {
    const reservas = lembrete.tipo === 'banho' ? ['banho', 'tosa'] : [];
    const tipo = tipoPeloTitulo(lembrete.titulo, cuidados, reservas);
    return {
      pathname: '/pet/[id]/cuidado-registro',
      params: tipo ? { id, tipoId: tipo.id } : { id },
      rotulo: 'Registrar o cuidado',
      onde: tipo ? `o cuidado “${tipo.nome}” na Rotina` : 'o cuidado na Rotina',
    };
  }
  if (lembrete.tipo === 'consulta') {
    return {
      pathname: '/pet/[id]/consulta',
      params: { id },
      rotulo: 'Registrar a consulta',
      onde: 'a consulta na Saúde, com veterinário e anexos',
    };
  }
  if (lembrete.tipo === 'passeio') {
    return {
      pathname: '/pet/[id]/passeio-registro',
      params: { id, ...passeioDoLembrete(lembrete, hoje) },
      rotulo: 'Registrar o passeio',
      onde: 'o passeio no histórico da Rotina, com a duração',
    };
  }
  return null;
}

/**
 * Valores para começar o registro do passeio: a data do lembrete (ou hoje, se ela ainda não
 * chegou, pois o passeio já aconteceu), a hora só quando a data é a do lembrete, e o título
 * como observação quando diz algo além de "Passeio".
 */
export function passeioDoLembrete(lembrete, hoje) {
  const data = lembrete.data && lembrete.data <= hoje ? lembrete.data : hoje;
  const valores = { data };
  if (data === lembrete.data && lembrete.hora) valores.hora = lembrete.hora;
  const titulo = String(lembrete.titulo ?? '').trim();
  if (titulo && normalizar(titulo) !== 'passeio') valores.observacao = titulo;
  return valores;
}

/**
 * Aviso para quem cria um lembrete de algo que o pet já acompanha sozinho, com o atalho para
 * o lugar certo. null para os tipos sem registro próprio.
 */
export function dicaDoTipo(tipo, petId) {
  if (tipo === 'vacina') {
    return {
      texto:
        'Vacinas cadastradas na carteirinha já avisam sozinhas da próxima dose. Para uma vacina que o pet toma sempre, cadastre lá.',
      botao: 'Abrir a carteirinha',
      rota: { pathname: '/pet/[id]', params: { id: petId, aba: 'saude', secao: 'vacinas' } },
    };
  }
  if (tipo === 'banho' || tipo === 'cuidado') {
    return {
      texto:
        'Cuidados cadastrados no pet (banho, tosa, vermífugo...) já avisam sozinhos da próxima vez, calculada pelo último registro.',
      botao: 'Abrir os cuidados',
      rota: { pathname: '/pet/[id]/cuidados', params: { id: petId } },
    };
  }
  if (tipo === 'consulta') {
    return {
      texto: 'Consultas agendadas na Saúde do pet já viram lembrete e guardam veterinário, valor e anexos.',
      botao: 'Agendar na Saúde',
      rota: { pathname: '/pet/[id]/consulta', params: { id: petId } },
    };
  }
  return null;
}
