import {
  calcularSituacao,
  compararPorUrgencia,
  proximaDose,
  rotuloSugerido,
  textoSituacao,
  ultimaDose,
} from './regrasVacina';
import { descreverIntervalo, sugestoesPara } from './catalogoVacinas';

const dose = (dataAplicacao, extra = {}) => ({ dataAplicacao, proximaDoseManual: null, ...extra });

describe('próxima dose', () => {
  it('é a última dose mais o intervalo', () => {
    const doses = [dose('2024-10-21'), dose('2025-10-18')];
    expect(ultimaDose(doses).dataAplicacao).toBe('2025-10-18');
    expect(proximaDose({ intervaloDias: 365 }, doses)).toBe('2026-10-18');
  });
  it('usa a data ajustada à mão, se existir', () => {
    const doses = [dose('2025-10-18', { proximaDoseManual: '2026-11-01' })];
    expect(proximaDose({ intervaloDias: 365 }, doses)).toBe('2026-11-01');
  });
  it('não há previsão sem dose ou sem intervalo', () => {
    expect(proximaDose({ intervaloDias: 365 }, [])).toBeNull();
    expect(proximaDose({ intervaloDias: null }, [dose('2025-10-18')])).toBeNull();
  });
});

describe('situação', () => {
  const HOJE = '2026-10-02';
  it('em dia quando faltam mais de 30 dias', () => {
    expect(calcularSituacao('2026-11-02', HOJE)).toEqual({ estado: 'em-dia', dias: 31 });
  });
  it('vence em breve com 30 dias ou menos', () => {
    expect(calcularSituacao('2026-11-01', HOJE)).toEqual({ estado: 'em-breve', dias: 30 });
    expect(calcularSituacao('2026-10-18', HOJE)).toEqual({ estado: 'em-breve', dias: 16 });
    expect(calcularSituacao('2026-10-02', HOJE)).toEqual({ estado: 'em-breve', dias: 0 });
  });
  it('atrasada depois da data', () => {
    expect(calcularSituacao('2026-09-27', HOJE)).toEqual({ estado: 'atrasada', dias: -5 });
  });
  it('sem previsão', () => {
    expect(calcularSituacao(null, HOJE)).toEqual({ estado: 'sem-previsao', dias: null });
  });
});

describe('textos', () => {
  it('descreve sem tom de cobrança', () => {
    expect(textoSituacao({ estado: 'atrasada', dias: -5 })).toBe('Atrasada, 5 dias');
    expect(textoSituacao({ estado: 'atrasada', dias: -1 })).toBe('Atrasada, 1 dia');
    expect(textoSituacao({ estado: 'em-breve', dias: 0 })).toBe('Vence hoje');
    expect(textoSituacao({ estado: 'em-breve', dias: 1 })).toBe('Vence amanhã');
    expect(textoSituacao({ estado: 'em-breve', dias: 16 })).toBe('Vence em 16 dias');
    expect(textoSituacao({ estado: 'em-dia', dias: 90 })).toBe('Em dia');
    expect(textoSituacao({ estado: 'sem-previsao', dias: null })).toBe('Sem previsão');
  });
  it('sugere o rótulo da dose', () => {
    expect(rotuloSugerido([])).toBe('1ª dose');
    expect(rotuloSugerido([dose('2025-01-01')])).toBe('2ª dose');
    expect(rotuloSugerido([dose('1'), dose('2')])).toBe('3ª dose');
    expect(rotuloSugerido([dose('1'), dose('2'), dose('3')])).toBe('Reforço');
  });
});

describe('ordem da carteirinha', () => {
  const item = (nome, estado, dias) => ({ tipo: { nome }, situacao: { estado, dias } });
  it('atrasadas, depois em breve, depois em dia, depois sem previsão', () => {
    const lista = [
      item('Gripe', 'em-dia', 200),
      item('Giárdia', 'sem-previsao', null),
      item('V8', 'em-breve', 16),
      item('Antirrábica', 'atrasada', -5),
    ];
    lista.sort(compararPorUrgencia);
    expect(lista.map((i) => i.tipo.nome)).toEqual(['Antirrábica', 'V8', 'Gripe', 'Giárdia']);
  });
  it('mais urgente primeiro dentro do mesmo estado', () => {
    const lista = [item('B', 'em-breve', 20), item('A', 'em-breve', 5)];
    lista.sort(compararPorUrgencia);
    expect(lista[0].tipo.nome).toBe('A');
  });
});

describe('catálogo', () => {
  it('sugere vacinas por espécie', () => {
    expect(sugestoesPara('cachorro').map((v) => v.nome)).toContain('V10');
    expect(sugestoesPara('gato').map((v) => v.nome)).toContain('V4');
    expect(sugestoesPara('outro').length).toBeGreaterThan(0);
  });
  it('descreve o intervalo', () => {
    expect(descreverIntervalo(365)).toBe('Reforço a cada 1 ano');
    expect(descreverIntervalo(730)).toBe('Reforço a cada 2 anos');
    expect(descreverIntervalo(180)).toBe('Reforço a cada 6 meses');
    expect(descreverIntervalo(45)).toBe('Reforço a cada 45 dias');
    expect(descreverIntervalo(null)).toBe('Sem reforço previsto');
  });
});
