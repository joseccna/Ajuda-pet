import { gastoDoAno, lerHora, mascararHora, separarConsultas, textoQuando } from './regrasConsulta';
import { centavosParaCampo, formatarReais, lerReais } from '../utils/dinheiro';

const HOJE = '2026-10-02';
const c = (id, data, hora = '') => ({ id, data, hora });

describe('hora', () => {
  it('lê hh:mm e aceita vazio', () => {
    expect(lerHora('14:30')).toEqual({ hora: '14:30' });
    expect(lerHora('')).toEqual({ hora: '' });
    expect(lerHora('25:00').erro).toBeDefined();
    expect(lerHora('14:60').erro).toBeDefined();
    expect(lerHora('1430').erro).toBeDefined();
  });
  it('mascara enquanto digita', () => {
    expect(mascararHora('1')).toBe('1');
    expect(mascararHora('143')).toBe('14:3');
    expect(mascararHora('14309')).toBe('14:30');
  });
});

describe('separarConsultas', () => {
  const lista = [
    c('a', '2026-09-03'),
    c('b', '2026-10-15', '14:30'),
    c('c', '2026-03-12'),
    c('d', '2026-10-02', '09:00'),
    c('e', '2026-10-15', '09:00'),
  ];
  const { proxima, agendadas, historico } = separarConsultas(lista, HOJE);

  it('a próxima é a mais perto de hoje, inclusive hoje', () => {
    expect(proxima.id).toBe('d');
    expect(agendadas.map((x) => x.id)).toEqual(['d', 'e', 'b']);
  });
  it('o histórico vai da mais recente para a mais antiga', () => {
    expect(historico.map((x) => x.id)).toEqual(['a', 'c']);
  });
  it('sem consulta futura, não há próxima', () => {
    expect(separarConsultas([c('x', '2026-01-01')], HOJE).proxima).toBeNull();
  });
});

describe('textoQuando', () => {
  it('descreve o quanto falta', () => {
    expect(textoQuando(c('a', '2026-10-02', '14:30'), HOJE)).toBe('Hoje, 14:30');
    expect(textoQuando(c('a', '2026-10-03'), HOJE)).toBe('Amanhã');
    expect(textoQuando(c('a', '2026-10-07', '10:00'), HOJE)).toBe('Em 5 dias, 10:00');
    expect(textoQuando(c('a', '2026-11-20'), HOJE)).toBe('20 nov 2026');
  });
});

describe('gasto do ano', () => {
  it('soma só consultas do ano que já aconteceram', () => {
    const consultas = [
      c('a', '2026-03-12'),
      c('b', '2026-09-03'),
      c('c', '2025-09-03'),
      c('d', '2026-12-01'),
    ];
    const privadas = {
      a: { valorCentavos: 28000 },
      b: { valorCentavos: 56000 },
      c: { valorCentavos: 9999 },
      d: { valorCentavos: 100 },
    };
    expect(gastoDoAno(consultas, privadas, 2026, HOJE)).toBe(84000);
  });
  it('consulta sem valor conta zero', () => {
    expect(gastoDoAno([c('a', '2026-03-12')], {}, 2026, HOJE)).toBe(0);
  });
});

describe('dinheiro', () => {
  it('lê reais em vários formatos', () => {
    expect(lerReais('280')).toEqual({ centavos: 28000 });
    expect(lerReais('280,5')).toEqual({ centavos: 28050 });
    expect(lerReais('1.280,00')).toEqual({ centavos: 128000 });
    expect(lerReais('R$ 280,00')).toEqual({ centavos: 28000 });
    expect(lerReais('280.50')).toEqual({ centavos: 28050 });
    expect(lerReais('')).toEqual({ centavos: null });
  });
  it('recusa texto e valores absurdos', () => {
    expect(lerReais('abc').erro).toBeDefined();
    expect(lerReais('1,234').erro).toBeDefined();
    expect(lerReais('99999999999').erro).toBeDefined();
  });
  it('formata com milhar e vírgula', () => {
    expect(formatarReais(28000)).toBe('R$ 280,00');
    expect(formatarReais(128005)).toBe('R$ 1.280,05');
    expect(formatarReais(5)).toBe('R$ 0,05');
    expect(formatarReais(null)).toBe('');
    expect(centavosParaCampo(28050)).toBe('280,50');
  });
});
