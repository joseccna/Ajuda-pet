import { dicaDoTipo, registroDoLembrete, tipoPeloTitulo } from './regrasLembrete';

const vacinas = [
  { id: 'v1', nome: 'V1' },
  { id: 'v10', nome: 'V10' },
  { id: 'raiva', nome: 'Antirrábica' },
];
const cuidados = [
  { id: 'banho', nome: 'Banho' },
  { id: 'verm', nome: 'Vermífugo' },
];

describe('tipoPeloTitulo', () => {
  it('acha o tipo pelo nome no título, sem ligar para acento e maiúsculas', () => {
    expect(tipoPeloTitulo('Antirrabica da Luna', vacinas).id).toBe('raiva');
    expect(tipoPeloTitulo('dar vermifugo', cuidados).id).toBe('verm');
  });
  it('o nome mais longo ganha (V10, não V1)', () => {
    expect(tipoPeloTitulo('Reforço da V10', vacinas).id).toBe('v10');
  });
  it('sem nome no título, usa os nomes de reserva ou nada', () => {
    expect(tipoPeloTitulo('Pet shop', cuidados, ['banho', 'tosa']).id).toBe('banho');
    expect(tipoPeloTitulo('Vacina', vacinas)).toBeNull();
  });
});

describe('registroDoLembrete', () => {
  it('vacina leva para registrar a dose, com a vacina escolhida quando o título diz qual', () => {
    const r = registroDoLembrete({ petId: 'p', tipo: 'vacina', titulo: 'V10' }, { vacinas });
    expect(r).toMatchObject({
      pathname: '/pet/[id]/dose',
      params: { id: 'p', tipoId: 'v10' },
      onde: 'a dose da V10 na carteirinha',
    });
    const sem = registroDoLembrete({ petId: 'p', tipo: 'vacina', titulo: 'Vacina' }, { vacinas });
    expect(sem.params).toEqual({ id: 'p' });
  });
  it('banho e outro cuidado levam ao registro de cuidado', () => {
    const banho = registroDoLembrete({ petId: 'p', tipo: 'banho', titulo: 'Banho e tosa' }, { cuidados });
    expect(banho).toMatchObject({
      pathname: '/pet/[id]/cuidado-registro',
      params: { id: 'p', tipoId: 'banho' },
    });
    expect(banho.onde).toBe('o cuidado “Banho” na Rotina');
    const outro = registroDoLembrete({ petId: 'p', tipo: 'cuidado', titulo: 'Escovar' }, { cuidados });
    expect(outro.params).toEqual({ id: 'p' });
  });
  it('consulta leva ao registro de consulta; medicação e passeio não têm registro', () => {
    expect(registroDoLembrete({ petId: 'p', tipo: 'consulta', titulo: 'Retorno' }).pathname).toBe(
      '/pet/[id]/consulta',
    );
    expect(registroDoLembrete({ petId: 'p', tipo: 'medicacao', titulo: 'Remédio' })).toBeNull();
    expect(registroDoLembrete({ petId: 'p', tipo: 'passeio', titulo: 'Parque' })).toBeNull();
  });
});

describe('dicaDoTipo', () => {
  it('aponta o lugar certo para vacina, cuidado e consulta', () => {
    expect(dicaDoTipo('vacina', 'p').rota).toEqual({
      pathname: '/pet/[id]',
      params: { id: 'p', aba: 'saude', secao: 'vacinas' },
    });
    expect(dicaDoTipo('banho', 'p').rota.pathname).toBe('/pet/[id]/cuidados');
    expect(dicaDoTipo('cuidado', 'p').botao).toBe('Abrir os cuidados');
    expect(dicaDoTipo('consulta', 'p').rota.pathname).toBe('/pet/[id]/consulta');
  });
  it('medicação e passeio não têm dica', () => {
    expect(dicaDoTipo('medicacao', 'p')).toBeNull();
    expect(dicaDoTipo('passeio', 'p')).toBeNull();
  });
});
