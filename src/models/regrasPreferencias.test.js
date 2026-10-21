import {
  ATALHOS_DISPONIVEIS,
  PADROES,
  alternarAtalho,
  atalhosDeTexto,
  atalhosParaTexto,
  lerHorarioPadrao,
  lerMeta,
  listaCompletaDeAtalhos,
  moverAtalho,
  normalizar,
  normalizarAtalhos,
} from './regrasPreferencias';
import { formatarDiferenca, formatarPeso } from './regrasPeso';
import { semanaAtual, percentualMeta } from './regrasPasseio';

describe('normalizar', () => {
  it('sem nada, devolve os padrões', () => {
    expect(normalizar()).toEqual(PADROES);
    expect(normalizar({})).toEqual(PADROES);
  });
  it('aceita valores válidos', () => {
    const p = normalizar({
      tema: 'escuro',
      unidadePeso: 'kg',
      horarioPadrao: '08:30',
      antecedenciaDias: 7,
      metaPasseioMin: 45,
      sugerirPesagem: false,
      atalhos: ['peso', 'passeio'],
    });
    expect(p).toEqual({
      tema: 'escuro',
      unidadePeso: 'kg',
      horarioPadrao: '08:30',
      antecedenciaDias: 7,
      metaPasseioMin: 45,
      sugerirPesagem: false,
      atalhos: ['peso', 'passeio'],
      lembreteBackupDias: 30,
      ultimoBackupEm: null,
    });
  });
  it('valores inválidos voltam ao padrão', () => {
    const p = normalizar({
      tema: 'roxo',
      unidadePeso: 'lb',
      horarioPadrao: '25:00',
      antecedenciaDias: 99,
      metaPasseioMin: 2,
      sugerirPesagem: 'sim',
      atalhos: ['xx'],
    });
    expect(p).toEqual(PADROES);
  });
  it('aceita números vindos do banco como texto', () => {
    expect(normalizar({ antecedenciaDias: '1', metaPasseioMin: '60' })).toMatchObject({
      antecedenciaDias: 1,
      metaPasseioMin: 60,
    });
  });
  it('antecedência zero é válida', () => {
    expect(normalizar({ antecedenciaDias: 0 }).antecedenciaDias).toBe(0);
  });
});

describe('entradas de texto', () => {
  it('lê a meta de passeio', () => {
    expect(lerMeta('30')).toEqual({ minutos: 30 });
    expect(lerMeta(' 45 ')).toEqual({ minutos: 45 });
    expect(lerMeta('').erro).toBeDefined();
    expect(lerMeta('abc').erro).toBeDefined();
    expect(lerMeta('2').erro).toBeDefined();
    expect(lerMeta('900').erro).toBeDefined();
  });
  it('lê o horário padrão', () => {
    expect(lerHorarioPadrao('09:00')).toEqual({ horario: '09:00' });
    expect(lerHorarioPadrao('').erro).toBeDefined();
    expect(lerHorarioPadrao('9:00').erro).toBeDefined();
    expect(lerHorarioPadrao('24:00').erro).toBeDefined();
  });
});

describe('atalhos do painel', () => {
  it('limpa repetidos e desconhecidos; vazio volta ao padrão', () => {
    expect(normalizarAtalhos(['peso', 'peso', 'xx', 'passeio'])).toEqual(['peso', 'passeio']);
    expect(normalizarAtalhos([])).toEqual(ATALHOS_DISPONIVEIS);
    expect(normalizarAtalhos(undefined)).toEqual(ATALHOS_DISPONIVEIS);
  });
  it('vai e volta entre lista e texto', () => {
    expect(atalhosParaTexto(['peso', 'dose'])).toBe('peso,dose');
    expect(atalhosDeTexto('peso,dose')).toEqual(['peso', 'dose']);
    expect(atalhosDeTexto('')).toEqual([]);
  });
  it('monta a lista completa: ativos na ordem escolhida e depois os desligados', () => {
    const l = listaCompletaDeAtalhos(['dose', 'peso']);
    expect(l.slice(0, 2)).toEqual([
      { chave: 'dose', ativo: true },
      { chave: 'peso', ativo: true },
    ]);
    expect(l.slice(2).every((x) => !x.ativo)).toBe(true);
    expect(l).toHaveLength(ATALHOS_DISPONIVEIS.length);
  });
  it('liga e desliga, sem deixar o painel sem atalhos', () => {
    expect(alternarAtalho(['peso', 'dose'], 'dose')).toEqual(['peso']);
    expect(alternarAtalho(['peso'], 'peso')).toEqual(['peso']);
    expect(alternarAtalho(['peso'], 'passeio')).toEqual(['peso', 'passeio']);
  });
  it('move para cima e para baixo, respeitando as pontas', () => {
    expect(moverAtalho(['a', 'b', 'c'], 'b', -1)).toEqual(['b', 'a', 'c']);
    expect(moverAtalho(['a', 'b', 'c'], 'b', 1)).toEqual(['a', 'c', 'b']);
    expect(moverAtalho(['a', 'b', 'c'], 'a', -1)).toEqual(['a', 'b', 'c']);
    expect(moverAtalho(['a', 'b', 'c'], 'c', 1)).toEqual(['a', 'b', 'c']);
    expect(moverAtalho(['a', 'b'], 'z', 1)).toEqual(['a', 'b']);
  });
});

describe('unidade do peso', () => {
  it('automática: gramas abaixo de 1 kg, quilos acima', () => {
    expect(formatarPeso(350)).toBe('350 g');
    expect(formatarPeso(28400, 'automatica')).toBe('28,4 kg');
  });
  it('quilos: sempre em kg', () => {
    expect(formatarPeso(350, 'kg')).toBe('0,35 kg');
    expect(formatarPeso(28400, 'kg')).toBe('28,4 kg');
    expect(formatarPeso(4250, 'kg')).toBe('4,25 kg');
    expect(formatarPeso(28000, 'kg')).toBe('28 kg');
  });
  it('gramas: sempre em g', () => {
    expect(formatarPeso(28400, 'g')).toBe('28400 g');
    expect(formatarPeso(350, 'g')).toBe('350 g');
  });
  it('a diferença segue a mesma unidade', () => {
    expect(formatarDiferenca(300, 'kg')).toBe('+0,3 kg');
    expect(formatarDiferenca(300, 'g')).toBe('+300 g');
    expect(formatarDiferenca(-1300)).toBe('-1,3 kg');
    expect(formatarDiferenca(0, 'g')).toBe('Sem mudança');
  });
});

describe('meta de passeio personalizada', () => {
  it('a semana usa a meta informada', () => {
    expect(semanaAtual([], '2026-10-02').metaMin).toBe(30);
    expect(semanaAtual([], '2026-10-02', 45).metaMin).toBe(45);
  });
  it('o percentual segue a meta', () => {
    expect(percentualMeta(30, 60)).toBe(50);
    expect(percentualMeta(30, 30)).toBe(100);
  });
});
