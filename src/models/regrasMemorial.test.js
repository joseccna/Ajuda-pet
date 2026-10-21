import {
  LIMITE_HOMENAGEM,
  descreverVida,
  ordenarMarcos,
  textoParaCompartilhar,
  validarDespedida,
  validarHomenagem,
} from './regrasMemorial';

const pet = (extra) => ({
  nome: 'Bidu',
  nascimento: null,
  nascimentoAproximado: false,
  dataFalecimento: null,
  ...extra,
});
const m = (data, criadoEm = '1') => ({ data, criadoEm });

describe('descreverVida', () => {
  it('anos de nascimento e de despedida, com a duração', () => {
    expect(descreverVida(pet({ nascimento: '2012-06-10', dataFalecimento: '2025-03-14' }))).toBe(
      '2012 a 2025, 12 anos de vida',
    );
    expect(descreverVida(pet({ nascimento: '2012-03-10', dataFalecimento: '2025-03-14' }))).toBe(
      '2012 a 2025, 13 anos de vida',
    );
  });
  it('nascimento aproximado aparece como "cerca de"', () => {
    expect(
      descreverVida(
        pet({ nascimento: '2012-03-10', nascimentoAproximado: true, dataFalecimento: '2025-03-14' }),
      ),
    ).toBe('2012 a 2025, cerca de 13 anos de vida');
  });
  it('um ano só de vida e vida curta', () => {
    expect(descreverVida(pet({ nascimento: '2024-01-10', dataFalecimento: '2025-02-14' }))).toBe(
      '2024 a 2025, 1 ano de vida',
    );
    expect(descreverVida(pet({ nascimento: '2025-01-10', dataFalecimento: '2025-06-14' }))).toBe(
      '2025, 5 meses de vida',
    );
    expect(descreverVida(pet({ nascimento: '2025-03-01', dataFalecimento: '2025-03-14' }))).toBe(
      '2025, menos de 1 mês de vida',
    );
  });
  it('sem nascimento, só a data da despedida; sem nada, vazio', () => {
    expect(descreverVida(pet({ dataFalecimento: '2025-03-14' }))).toBe('Despedida em 14 mar 2025');
    expect(descreverVida(pet({}))).toBe('');
  });
});

describe('validações', () => {
  const HOJE = new Date(2026, 9, 2, 12);
  it('a despedida precisa de data válida', () => {
    expect(validarDespedida({ dataISO: '2025-03-14', nascimento: '2012-03-10' }, HOJE)).toEqual({});
    expect(validarDespedida({ dataISO: '', nascimento: null }, HOJE).data).toBeDefined();
    expect(validarDespedida({ dataISO: '2026-10-03', nascimento: null }, HOJE).data).toBeDefined();
    expect(validarDespedida({ dataISO: '2026-10-02', nascimento: null }, HOJE)).toEqual({});
    expect(validarDespedida({ dataISO: '2010-01-01', nascimento: '2012-03-10' }, HOJE).data).toBeDefined();
  });
  it('a homenagem é opcional e tem limite', () => {
    expect(validarHomenagem('')).toEqual({});
    expect(validarHomenagem('x'.repeat(LIMITE_HOMENAGEM))).toEqual({});
    expect(validarHomenagem('x'.repeat(LIMITE_HOMENAGEM + 1)).texto).toBeDefined();
  });
});

describe('linha do tempo e compartilhar', () => {
  it('ordena por data e deixa os sem data no fim', () => {
    const lista = [
      m('2025-03-14', 'a'),
      m(null, 'b'),
      m('2012-06-10', 'c'),
      m(null, 'a'),
      m('2012-06-10', 'a'),
    ];
    expect(ordenarMarcos(lista).map((x) => `${x.data}|${x.criadoEm}`)).toEqual([
      '2012-06-10|a',
      '2012-06-10|c',
      '2025-03-14|a',
      'null|a',
      'null|b',
    ]);
  });
  it('monta o texto para compartilhar', () => {
    const p = pet({ nascimento: '2012-03-10', dataFalecimento: '2025-03-14' });
    expect(textoParaCompartilhar(p, 'Companheiro de todas as manhãs.')).toBe(
      'Bidu\n2012 a 2025, 13 anos de vida\n\nCompanheiro de todas as manhãs.',
    );
    expect(textoParaCompartilhar(p, '')).toBe('Bidu\n2012 a 2025, 13 anos de vida');
  });
});
