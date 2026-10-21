import {
  calcularPontos,
  diasDesdeUltima,
  escolherRotulos,
  filtrarPeriodo,
  formatarDiferenca,
  formatarPeso,
  lerPeso,
  saltoSuspeito,
  temVariacaoRelevante,
  variacaoDaSerie,
} from './regrasPeso';

const HOJE = '2026-10-02';
const r = (data, pesoG, criadoEm = data) => ({ data, pesoG, criadoEm });

describe('lerPeso', () => {
  it('lê quilos com vírgula ou ponto', () => {
    expect(lerPeso('28,4', 'kg')).toEqual({ gramas: 28400 });
    expect(lerPeso('28.4', 'kg')).toEqual({ gramas: 28400 });
    expect(lerPeso('4,25', 'kg')).toEqual({ gramas: 4250 });
  });
  it('lê gramas', () => {
    expect(lerPeso('350', 'g')).toEqual({ gramas: 350 });
  });
  it('recusa vazio, texto e valores fora do comum', () => {
    expect(lerPeso('', 'kg').erro).toBeDefined();
    expect(lerPeso('abc', 'kg').erro).toBeDefined();
    expect(lerPeso('0', 'kg').erro).toBeDefined();
    expect(lerPeso('300', 'kg').erro).toBeDefined();
    expect(lerPeso('1', 'g').erro).toBeDefined();
  });
});

describe('formatação', () => {
  it('mostra kg ou g', () => {
    expect(formatarPeso(28400)).toBe('28,4 kg');
    expect(formatarPeso(28000)).toBe('28 kg');
    expect(formatarPeso(4250)).toBe('4,25 kg');
    expect(formatarPeso(1000)).toBe('1 kg');
    expect(formatarPeso(350)).toBe('350 g');
  });
  it('mostra a diferença com sinal', () => {
    expect(formatarDiferenca(300)).toBe('+300 g');
    expect(formatarDiferenca(1300)).toBe('+1,3 kg');
    expect(formatarDiferenca(-200)).toBe('-200 g');
    expect(formatarDiferenca(0)).toBe('Sem mudança');
  });
});

describe('período e variação', () => {
  const registros = [
    r('2025-01-10', 26000),
    r('2026-04-10', 27800),
    r('2026-07-15', 28100),
    r('2026-10-01', 28400),
    r('2026-10-20', 29000), // futuro: não conta
  ];
  it('filtra pelo período e ordena do mais antigo ao mais recente', () => {
    expect(filtrarPeriodo(registros, '6m', HOJE).map((x) => x.data)).toEqual([
      '2026-04-10',
      '2026-07-15',
      '2026-10-01',
    ]);
    expect(filtrarPeriodo(registros, '3m', HOJE).map((x) => x.data)).toEqual(['2026-07-15', '2026-10-01']);
    expect(filtrarPeriodo(registros, 'tudo', HOJE)).toHaveLength(4);
  });
  it('desempata por ordem de criação no mesmo dia', () => {
    const dois = [r('2026-10-01', 28500, 'b'), r('2026-10-01', 28300, 'a')];
    expect(filtrarPeriodo(dois, '3m', HOJE).map((x) => x.pesoG)).toEqual([28300, 28500]);
  });
  it('calcula a variação da série', () => {
    expect(variacaoDaSerie(filtrarPeriodo(registros, '6m', HOJE))).toBe(600);
    expect(variacaoDaSerie([r('2026-10-01', 28400)])).toBeNull();
  });
});

describe('alertas', () => {
  it('pergunta "Confere?" quando o salto passa de 20%', () => {
    expect(saltoSuspeito(28200, 284000)).toBe(true);
    expect(saltoSuspeito(28200, 28400)).toBe(false);
    expect(saltoSuspeito(28200, 23000)).toBe(false);
    expect(saltoSuspeito(28200, 20000)).toBe(true);
    expect(saltoSuspeito(null, 28400)).toBe(false);
  });
  it('avisa variação de 10% ou mais em 60 dias, menos para filhotes', () => {
    const subiu = [r('2026-08-20', 25000), r('2026-10-01', 28000)];
    expect(temVariacaoRelevante(subiu, HOJE, 48)).toBe(true);
    expect(temVariacaoRelevante(subiu, HOJE, null)).toBe(true);
    expect(temVariacaoRelevante(subiu, HOJE, 8)).toBe(false);
    expect(temVariacaoRelevante([r('2026-08-20', 28000), r('2026-10-01', 28400)], HOJE, 48)).toBe(false);
    expect(temVariacaoRelevante([r('2026-01-10', 20000), r('2026-10-01', 28000)], HOJE, 48)).toBe(false);
    expect(temVariacaoRelevante([r('2026-10-01', 28000)], HOJE, 48)).toBe(false);
  });
  it('conta os dias desde a última pesagem', () => {
    expect(diasDesdeUltima([r('2026-08-18', 28000), r('2026-08-20', 28100)], HOJE)).toBe(43);
    expect(diasDesdeUltima([], HOJE)).toBeNull();
  });
});

describe('calcularPontos', () => {
  it('posiciona os pontos: o mais pesado fica mais alto', () => {
    const serie = [r('2026-04-10', 27800), r('2026-07-15', 28100), r('2026-10-01', 28400)];
    const { pontos, linha } = calcularPontos(serie, 340, 160);
    expect(pontos).toHaveLength(3);
    expect(pontos[0].x).toBeLessThan(pontos[2].x);
    expect(pontos[0].y).toBeGreaterThan(pontos[2].y);
    expect(pontos[0].x).toBe(24);
    expect(pontos[2].x).toBe(316);
    expect(linha.split(' ')).toHaveLength(3);
  });
  it('um ponto só fica no meio, sem dividir por zero', () => {
    const { pontos } = calcularPontos([r('2026-10-01', 28400)], 340, 160);
    expect(pontos[0].x).toBe(170);
    expect(Number.isFinite(pontos[0].y)).toBe(true);
  });
  it('pesos iguais viram uma linha reta no meio', () => {
    const { pontos } = calcularPontos([r('2026-09-01', 28000), r('2026-10-01', 28000)], 340, 160);
    expect(pontos[0].y).toBeCloseTo(pontos[1].y);
  });
  it('série vazia não quebra', () => {
    expect(calcularPontos([], 340, 160).pontos).toEqual([]);
  });
});

describe('escolherRotulos', () => {
  const x = (...xs) => xs.map((v) => ({ x: v }));
  it('sempre rotula o primeiro e o último', () => {
    expect(escolherRotulos(x(24, 316))).toEqual([true, true]);
    expect(escolherRotulos(x(170))).toEqual([true]);
  });
  it('rotula os do meio só quando há espaço', () => {
    expect(escolherRotulos(x(24, 170, 316))).toEqual([true, true, true]);
    expect(escolherRotulos(x(24, 60, 316))).toEqual([true, false, true]);
    expect(escolherRotulos(x(24, 100, 180, 260, 316))).toEqual([true, true, true, false, true]);
  });
  it('não rotula um ponto do meio colado no último', () => {
    expect(escolherRotulos(x(24, 280, 316))).toEqual([true, false, true]);
  });
});
