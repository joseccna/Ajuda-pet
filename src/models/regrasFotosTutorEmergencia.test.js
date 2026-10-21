import {
  agruparPorMes,
  contarFotos,
  contarSelecionadas,
  tamanhoDoQuadrado,
  tituloDoMes,
} from './regrasFotos';
import {
  iniciais,
  lerEmail,
  lerTelefone,
  linkDeTelefone,
  mascararTelefone,
  nomeParaSaudacao,
  saudacaoComNome,
} from './regrasTutor';
import { montarCartao, montarContatos, resumirVacinas } from './regrasEmergencia';
import { Pet } from './Pet';

jest.mock('expo-crypto', () => ({ randomUUID: () => 'id' }));

const f = (data, criadoEm = data) => ({ data, criadoEm });

describe('galeria', () => {
  it('agrupa por mês, do mais recente ao mais antigo', () => {
    const grupos = agruparPorMes([f('2026-09-03'), f('2026-10-02'), f('2026-10-20'), f('2025-12-31')]);
    expect(grupos.map((g) => g.titulo)).toEqual(['Outubro de 2026', 'Setembro de 2026', 'Dezembro de 2025']);
    expect(grupos[0].fotos.map((x) => x.data)).toEqual(['2026-10-20', '2026-10-02']);
    expect(grupos[0].chave).toBe('2026-10');
  });
  it('no mesmo dia, a mais nova primeiro', () => {
    const [g] = agruparPorMes([f('2026-10-02', 'a'), f('2026-10-02', 'c'), f('2026-10-02', 'b')]);
    expect(g.fotos.map((x) => x.criadoEm)).toEqual(['c', 'b', 'a']);
  });
  it('galeria vazia', () => {
    expect(agruparPorMes([])).toEqual([]);
  });
  it('textos de contagem e título do mês', () => {
    expect(contarFotos(0)).toBe('Nenhuma foto');
    expect(contarFotos(1)).toBe('1 foto');
    expect(contarFotos(86)).toBe('86 fotos');
    expect(contarSelecionadas(1)).toBe('1 selecionada');
    expect(contarSelecionadas(3)).toBe('3 selecionadas');
    expect(tituloDoMes('2026-03')).toBe('Março de 2026');
  });
  it('calcula o tamanho do quadrado da grade', () => {
    expect(tamanhoDoQuadrado(358, 3, 4)).toBe(116);
    expect(tamanhoDoQuadrado(0)).toBe(0);
  });
});

describe('telefone, e-mail e nome', () => {
  it('mascara enquanto digita', () => {
    expect(mascararTelefone('1')).toBe('(1');
    expect(mascararTelefone('119')).toBe('(11) 9');
    expect(mascararTelefone('1130001111')).toBe('(11) 3000-1111');
    expect(mascararTelefone('11912345678')).toBe('(11) 91234-5678');
    expect(mascararTelefone('1191234567899')).toBe('(11) 91234-5678');
    expect(mascararTelefone('')).toBe('');
  });
  it('valida o telefone', () => {
    expect(lerTelefone('')).toEqual({ telefone: '' });
    expect(lerTelefone('(11) 91234-5678')).toEqual({ telefone: '(11) 91234-5678' });
    expect(lerTelefone('11912345678')).toEqual({ telefone: '(11) 91234-5678' });
    expect(lerTelefone('1191234').erro).toBeDefined();
  });
  it('monta o link do discador', () => {
    expect(linkDeTelefone('(11) 91234-5678')).toBe('tel:11912345678');
    expect(linkDeTelefone('')).toBe('');
  });
  it('valida o e-mail', () => {
    expect(lerEmail('')).toEqual({ email: '' });
    expect(lerEmail(' maria@email.com ')).toEqual({ email: 'maria@email.com' });
    expect(lerEmail('maria@email').erro).toBeDefined();
    expect(lerEmail('maria email.com').erro).toBeDefined();
  });
  it('chama o tutor pelo apelido, ou pelo primeiro nome', () => {
    expect(nomeParaSaudacao({ nome: 'Maria Alves', apelido: 'Mari' })).toBe('Mari');
    expect(nomeParaSaudacao({ nome: 'Maria Alves', apelido: '' })).toBe('Maria');
    expect(nomeParaSaudacao({ nome: '', apelido: '' })).toBe('');
    expect(nomeParaSaudacao(null)).toBe('');
    expect(saudacaoComNome('Bom dia', { nome: 'Ana Souza', apelido: '' })).toBe('Bom dia, Ana');
    expect(saudacaoComNome('Boa tarde', null)).toBe('Boa tarde');
  });
  it('tira as iniciais', () => {
    expect(iniciais('Maria Alves')).toBe('MA');
    expect(iniciais('Ana')).toBe('A');
    expect(iniciais('Ana Maria de Souza')).toBe('AS');
    expect(iniciais('')).toBe('?');
  });
});

describe('cartão de emergência', () => {
  const cartao = (nome, estado, dias, texto) => ({ tipo: { nome }, situacao: { estado, dias }, texto });
  const tutor = {
    nome: 'Ana Souza',
    telefone: '(11) 91234-5678',
    emergenciaNome: 'Camila',
    emergenciaRelacao: 'irmã',
    emergenciaTelefone: '(11) 98765-4321',
    vetNome: 'Dra. Paula Reis',
    vetClinica: 'VetCare',
    vetTelefone: '(11) 3000-0000',
  };

  it('resume as vacinas', () => {
    expect(resumirVacinas([])).toEqual({
      estado: 'sem-registro',
      texto: 'Nenhuma vacina cadastrada',
      detalhe: '',
    });
    expect(
      resumirVacinas([
        cartao('V8', 'em-breve', 16, 'Vence em 16 dias'),
        cartao('Gripe', 'em-dia', 200, 'Em dia'),
      ]),
    ).toEqual({
      estado: 'em-breve',
      texto: 'Nenhuma atrasada',
      detalhe: 'V8: vence em 16 dias',
    });
    expect(
      resumirVacinas([
        cartao('Antirrábica', 'atrasada', -5, 'Atrasada, 5 dias'),
        cartao('V8', 'atrasada', -2, ''),
      ]),
    ).toEqual({
      estado: 'atrasada',
      texto: '2 atrasadas',
      detalhe: 'Antirrábica, V8',
    });
    expect(resumirVacinas([cartao('Gripe', 'em-dia', 200, 'Em dia')]).estado).toBe('em-dia');
  });

  it('monta os contatos só com os que têm telefone', () => {
    expect(montarContatos(tutor).map((c) => [c.rotulo, c.nome, c.telefone])).toEqual([
      ['Tutor', 'Ana Souza', '(11) 91234-5678'],
      ['Contato de emergência', 'Camila, irmã', '(11) 98765-4321'],
      ['Veterinário', 'Dra. Paula Reis, VetCare', '(11) 3000-0000'],
    ]);
    expect(montarContatos({ nome: 'Ana', telefone: '' })).toEqual([]);
    expect(montarContatos(null)).toEqual([]);
  });

  it('monta o cartão com o texto para compartilhar, sem dados privados', () => {
    const pet = new Pet({
      nome: 'Luna',
      sexo: 'femea',
      raca: 'Golden Retriever',
      observacoes: 'Suspeita de alergia alimentar',
      microchip: '985 112 004 567 890',
      castrado: 'sim',
    });
    const c = montarCartao({
      pet,
      pesoG: 28400,
      cartoesVacina: [cartao('V8', 'em-breve', 16, 'Vence em 16 dias')],
      tutor,
    });
    expect(c.cabecalho).toBe('Cachorra, Golden Retriever, 28,4 kg');
    expect(c.linhas.map((l) => l.chave)).toEqual(['vacinas', 'observacoes', 'microchip', 'castrado']);
    expect(c.contatos).toHaveLength(3);
    expect(c.textoCompartilhar).toBe(
      [
        'Cartão de emergência: Luna',
        'Cachorra, Golden Retriever, 28,4 kg',
        'Vacinas: Nenhuma atrasada (V8: vence em 16 dias)',
        'Alergias e observações: Suspeita de alergia alimentar',
        'Microchip: 985 112 004 567 890',
        'Tutor: Ana Souza, (11) 91234-5678',
        'Contato de emergência: Camila, irmã, (11) 98765-4321',
        'Veterinário: Dra. Paula Reis, VetCare, (11) 3000-0000',
      ].join('\n'),
    );
  });

  it('funciona com poucos dados', () => {
    const c = montarCartao({
      pet: new Pet({ nome: 'Thor', sexo: 'macho' }),
      pesoG: null,
      cartoesVacina: [],
      tutor: null,
    });
    expect(c.cabecalho).toBe('Cachorro');
    expect(c.linhas.find((l) => l.chave === 'observacoes').valor).toBe('Nenhuma informada');
    expect(c.linhas.some((l) => l.chave === 'microchip')).toBe(false);
    expect(c.contatos).toEqual([]);
    expect(c.textoCompartilhar).toContain('Alergias e observações: nenhuma informada');
  });
});
