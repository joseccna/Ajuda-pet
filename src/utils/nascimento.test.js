import { nascimentoDoPet, nascimentoVazio, resolverNascimento } from './nascimento';
const HOJE = new Date(2026, 9, 2, 12, 0, 0);
describe('resolverNascimento', () => {
  it('campo vazio é válido e não gera data', () => {
    expect(resolverNascimento(nascimentoVazio, HOJE)).toEqual({ iso: null, aproximada: false });
    expect(resolverNascimento({ ...nascimentoVazio, modo: 'aproximada' }, HOJE)).toEqual({
      iso: null,
      aproximada: false,
    });
  });
  it('data exata válida', () => {
    expect(resolverNascimento({ ...nascimentoVazio, texto: '12/03/2022' }, HOJE)).toEqual({
      iso: '2022-03-12',
      aproximada: false,
    });
  });
  it('data exata inválida devolve erro', () => {
    const r = resolverNascimento({ ...nascimentoVazio, texto: '31/02/2022' }, HOJE);
    expect(r.iso).toBeNull();
    expect(r.erro).toBe('Essa data não existe.');
  });
  it('idade aproximada vira data estimada e fica marcada como aproximada', () => {
    expect(resolverNascimento({ modo: 'aproximada', texto: '', anos: '4', meses: '' }, HOJE)).toEqual({
      iso: '2022-10-02',
      aproximada: true,
    });
  });
  it('recusa meses acima de 11 e anos exagerados', () => {
    expect(
      resolverNascimento({ modo: 'aproximada', texto: '', anos: '2', meses: '14' }, HOJE).erro,
    ).toBeDefined();
    expect(
      resolverNascimento({ modo: 'aproximada', texto: '', anos: '99', meses: '0' }, HOJE).erro,
    ).toBeDefined();
  });
});

describe('nascimentoDoPet (editar um pet salvo)', () => {
  it('nascimento aproximado volta como idade e, sem mudar a idade, fica igual (BUG-01, QA-01)', () => {
    const campo = nascimentoDoPet('2022-05-20', true, HOJE);
    expect(campo).toMatchObject({ modo: 'aproximada', anos: '4', meses: '4' });
    // Salvar sem mexer: mesma data e continua aproximado.
    expect(resolverNascimento(campo, HOJE)).toEqual({ iso: '2022-05-20', aproximada: true });
    // Meses depois, salvar de novo também não muda a data.
    expect(resolverNascimento(nascimentoDoPet('2022-05-20', true, HOJE), new Date(2027, 2, 1))).toEqual({
      iso: '2022-05-20',
      aproximada: true,
    });
  });
  it('mudando a idade, recalcula a data e continua aproximado', () => {
    const campo = { ...nascimentoDoPet('2022-05-20', true, HOJE), anos: '5' };
    expect(resolverNascimento(campo, HOJE)).toEqual({ iso: '2021-06-02', aproximada: true });
  });
  it('nascimento exato continua exato (QA-02, controle)', () => {
    const campo = nascimentoDoPet('2022-03-12', false, HOJE);
    expect(campo).toEqual({ modo: 'exata', texto: '12/03/2022', anos: '', meses: '' });
    expect(resolverNascimento(campo, HOJE)).toEqual({ iso: '2022-03-12', aproximada: false });
  });
  it('sem nascimento, o campo vem vazio', () => {
    expect(nascimentoDoPet(null, false, HOJE)).toEqual(nascimentoVazio);
  });
});
