import {
  dataAproximada,
  diferencaEmDias,
  saudacao,
  somarDias,
  descreverIdade,
  formatarDataBR,
  formatarDataCurta,
  idadeEmMeses,
  lerDataBR,
  mascararDataBR,
  paraISO,
} from './datas';
const HOJE = new Date(2026, 9, 2, 12, 0, 0); // 2 de outubro de 2026
describe('mascararDataBR', () => {
  it('insere as barras enquanto digita', () => {
    expect(mascararDataBR('1')).toBe('1');
    expect(mascararDataBR('120')).toBe('12/0');
    expect(mascararDataBR('12032022')).toBe('12/03/2022');
  });
  it('ignora letras e passa de 8 dígitos', () => {
    expect(mascararDataBR('12a03b2022999')).toBe('12/03/2022');
  });
});
describe('lerDataBR', () => {
  it('aceita uma data válida', () => {
    expect(lerDataBR('12/03/2022', HOJE)).toEqual({ iso: '2022-03-12' });
  });
  it('recusa formato incompleto', () => {
    expect(lerDataBR('12/03', HOJE)).toEqual({ erro: 'Use o formato dd/mm/aaaa.' });
  });
  it('recusa data que não existe', () => {
    expect(lerDataBR('31/02/2022', HOJE)).toEqual({ erro: 'Essa data não existe.' });
    expect(lerDataBR('29/02/2023', HOJE)).toEqual({ erro: 'Essa data não existe.' });
  });
  it('aceita 29 de fevereiro em ano bissexto', () => {
    expect(lerDataBR('29/02/2024', HOJE)).toEqual({ iso: '2024-02-29' });
  });
  it('aceita data futura quando permitido (próxima dose)', () => {
    expect(lerDataBR('18/10/2026', HOJE, true)).toEqual({ iso: '2026-10-18' });
  });
  it('recusa data no futuro, mas aceita hoje', () => {
    expect(lerDataBR('03/10/2026', HOJE)).toEqual({ erro: 'A data não pode ser no futuro.' });
    expect(lerDataBR('02/10/2026', HOJE)).toEqual({ iso: '2026-10-02' });
  });
});
describe('formatação', () => {
  it('mostra dd/mm/aaaa e "12 mar 2022"', () => {
    expect(formatarDataBR('2022-03-12')).toBe('12/03/2022');
    expect(formatarDataCurta('2022-03-12')).toBe('12 mar 2022');
    expect(formatarDataBR(null)).toBe('');
  });
});
describe('idade', () => {
  it('conta meses completos', () => {
    expect(idadeEmMeses('2022-03-12', HOJE)).toBe(54);
    expect(idadeEmMeses('2022-10-02', HOJE)).toBe(48);
    expect(idadeEmMeses('2022-10-03', HOJE)).toBe(47);
  });
  it('descreve em anos, meses ou menos de 1 mês', () => {
    expect(descreverIdade('2022-03-12', false, HOJE)).toBe('4 anos');
    expect(descreverIdade('2025-10-02', false, HOJE)).toBe('1 ano');
    expect(descreverIdade('2026-02-02', false, HOJE)).toBe('8 meses');
    expect(descreverIdade('2026-09-02', false, HOJE)).toBe('1 mês');
    expect(descreverIdade('2026-09-20', false, HOJE)).toBe('Menos de 1 mês');
  });
  it('avisa quando é aproximada ou desconhecida', () => {
    expect(descreverIdade('2022-10-02', true, HOJE)).toBe('Cerca de 4 anos');
    expect(descreverIdade(null, false, HOJE)).toBe('Idade desconhecida');
  });
});
describe('dataAproximada', () => {
  it('volta anos e meses a partir de hoje', () => {
    expect(dataAproximada(4, 0, HOJE)).toBe('2022-10-02');
    expect(dataAproximada(1, 6, HOJE)).toBe('2025-04-02');
  });
  it('não passa do último dia do mês', () => {
    expect(dataAproximada(0, 8, new Date(2026, 9, 31, 12))).toBe('2026-02-28');
  });
  it('gera uma data cuja idade bate com o informado', () => {
    const iso = dataAproximada(3, 5, HOJE);
    expect(idadeEmMeses(iso, HOJE)).toBe(41);
    expect(iso).toBe(paraISO(new Date(2023, 4, 2, 12)));
  });
});

describe('dias', () => {
  it('soma dias, inclusive virando o mês e o ano', () => {
    expect(somarDias('2025-10-18', 365)).toBe('2026-10-18');
    expect(somarDias('2026-10-30', 3)).toBe('2026-11-02');
    expect(somarDias('2026-01-02', -3)).toBe('2025-12-30');
  });
  it('conta a diferença em dias', () => {
    expect(diferencaEmDias('2026-10-02', '2026-10-18')).toBe(16);
    expect(diferencaEmDias('2026-10-02', '2026-09-27')).toBe(-5);
    expect(diferencaEmDias('2026-10-02', '2026-10-02')).toBe(0);
  });
  it('sauda conforme a hora', () => {
    expect(saudacao(3)).toBe('Boa noite');
    expect(saudacao(8)).toBe('Bom dia');
    expect(saudacao(14)).toBe('Boa tarde');
    expect(saudacao(20)).toBe('Boa noite');
  });
});
