import { nascimentoVazio, resolverNascimento } from './nascimento';
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
