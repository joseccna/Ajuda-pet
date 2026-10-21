import { formatarPeso } from './regrasPeso';

/**
 * Cartão de emergência: junta o que importa em uma situação de pressa. Funções puras.
 * Nunca inclui valores, anotações pessoais nem memorial.
 */

const CASTRADO = { sim: 'Sim', nao: 'Não', desconhecido: '' };

/** Resume a carteirinha: quantas vacinas atrasadas e qual a próxima a vencer. */
export function resumirVacinas(cartoes) {
  const atrasadas = cartoes.filter((c) => c.situacao.estado === 'atrasada');
  const proxima = cartoes
    .filter((c) => c.situacao.estado === 'em-breve')
    .sort((a, b) => a.situacao.dias - b.situacao.dias)[0];

  if (cartoes.length === 0)
    return { estado: 'sem-registro', texto: 'Nenhuma vacina cadastrada', detalhe: '' };
  if (atrasadas.length > 0) {
    const nomes = atrasadas.map((c) => c.tipo.nome).join(', ');
    return {
      estado: 'atrasada',
      texto: `${atrasadas.length} ${atrasadas.length === 1 ? 'atrasada' : 'atrasadas'}`,
      detalhe: nomes,
    };
  }
  return {
    estado: proxima ? 'em-breve' : 'em-dia',
    texto: 'Nenhuma atrasada',
    detalhe: proxima ? `${proxima.tipo.nome}: ${proxima.texto.toLowerCase()}` : '',
  };
}

/** Contatos com telefone e rótulo: tutor, contato de emergência e veterinária. */
export function montarContatos(tutor) {
  if (!tutor) return [];
  const contatos = [];
  if (tutor.telefone)
    contatos.push({ chave: 'tutor', rotulo: 'Tutor', nome: tutor.nome || 'Tutor', telefone: tutor.telefone });
  if (tutor.emergenciaTelefone) {
    contatos.push({
      chave: 'emergencia',
      rotulo: 'Contato de emergência',
      nome:
        [tutor.emergenciaNome, tutor.emergenciaRelacao].filter(Boolean).join(', ') || 'Contato de emergência',
      telefone: tutor.emergenciaTelefone,
    });
  }
  if (tutor.vetTelefone) {
    contatos.push({
      chave: 'veterinario',
      rotulo: 'Veterinário',
      nome: [tutor.vetNome, tutor.vetClinica].filter(Boolean).join(', ') || 'Veterinário',
      telefone: tutor.vetTelefone,
    });
  }
  return contatos;
}

/**
 * Monta o cartão. Entradas: o pet, o peso atual (gramas ou null), os cartões da carteirinha e o tutor.
 * Devolve as linhas para mostrar, os contatos e o texto para compartilhar.
 */
export function montarCartao({ pet, pesoG, cartoesVacina, tutor, unidadePeso = 'automatica' }) {
  const vacinas = resumirVacinas(cartoesVacina);
  const contatos = montarContatos(tutor);

  const linhas = [
    {
      chave: 'vacinas',
      rotulo: 'Vacinas',
      valor: vacinas.texto,
      detalhe: vacinas.detalhe,
      estado: vacinas.estado,
    },
    { chave: 'observacoes', rotulo: 'Alergias e observações', valor: pet.observacoes || 'Nenhuma informada' },
  ];
  if (pet.microchip) linhas.push({ chave: 'microchip', rotulo: 'Microchip', valor: pet.microchip });
  if (CASTRADO[pet.castrado])
    linhas.push({ chave: 'castrado', rotulo: 'Castrado', valor: CASTRADO[pet.castrado] });

  const cabecalho = [
    pet.rotuloEspecie,
    pet.raca,
    pet.idade !== 'Idade desconhecida' ? pet.idade : '',
    pesoG ? formatarPeso(pesoG, unidadePeso) : '',
  ]
    .filter(Boolean)
    .join(', ');

  const texto = [
    `Cartão de emergência: ${pet.nome}`,
    cabecalho,
    `Vacinas: ${vacinas.texto}${vacinas.detalhe ? ` (${vacinas.detalhe})` : ''}`,
    `Alergias e observações: ${pet.observacoes || 'nenhuma informada'}`,
    pet.microchip ? `Microchip: ${pet.microchip}` : '',
    ...contatos.map((c) => `${c.rotulo}: ${c.nome}, ${c.telefone}`),
  ]
    .filter(Boolean)
    .join('\n');

  return { titulo: pet.nome, cabecalho, linhas, contatos, vacinas, textoCompartilhar: texto };
}
