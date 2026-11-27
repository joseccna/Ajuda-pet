jest.mock('expo-crypto', () => ({ randomUUID: () => require('crypto').randomUUID() }));

import { RegistroCuidado } from './RegistroCuidado';
import {
  CATALOGO_CUIDADOS,
  agendados,
  feitos,
  janelaAviso,
  proximoCuidado,
  situacaoCuidado,
  textoCuidado,
  textoUltimo,
} from './regrasCuidado';
import { TipoCuidado } from './TipoCuidado';

const HOJE = '2026-10-20';
const reg = (data, extra = {}) => ({ id: `r-${data}`, data, ...extra });
const banho = { intervaloDias: 15 };
const mensal = { intervaloDias: 30 };
const semIntervalo = { intervaloDias: null };

describe('janela de "vence em breve"', () => {
  it('é 20% do intervalo, com no mínimo 2 e no máximo 7 dias', () => {
    expect(janelaAviso(7)).toBe(2);
    expect(janelaAviso(15)).toBe(3);
    expect(janelaAviso(30)).toBe(6);
    expect(janelaAviso(60)).toBe(7);
    expect(janelaAviso(365)).toBe(7);
  });

  it('sem intervalo não há janela', () => {
    expect(janelaAviso(null)).toBe(0);
    expect(janelaAviso(0)).toBe(0);
  });
});

describe('feitos e agendados', () => {
  const registros = [reg('2026-09-01'), reg('2026-10-25'), reg(HOJE), reg('2026-11-10'), reg('2026-10-01')];

  it('feitos vão até hoje (inclusive), do mais recente ao mais antigo', () => {
    expect(feitos(registros, HOJE).map((r) => r.data)).toEqual([HOJE, '2026-10-01', '2026-09-01']);
  });

  it('agendados são os de depois de hoje, do mais próximo ao mais distante', () => {
    expect(agendados(registros, HOJE).map((r) => r.data)).toEqual(['2026-10-25', '2026-11-10']);
  });

  it('não altera a lista recebida', () => {
    const copia = registros.map((r) => r.data);
    feitos(registros, HOJE);
    agendados(registros, HOJE);
    expect(registros.map((r) => r.data)).toEqual(copia);
  });
});

describe('próxima data do cuidado', () => {
  it('o agendamento mais próximo vale mais que o último feito mais o intervalo', () => {
    const registros = [reg('2026-10-10'), reg('2026-11-30'), reg('2026-11-05')];
    expect(proximoCuidado(banho, registros, HOJE)).toBe('2026-11-05');
  });

  it('sem agendamento, é o último feito mais o intervalo', () => {
    expect(proximoCuidado(banho, [reg('2026-09-01'), reg('2026-10-10')], HOJE)).toBe('2026-10-25');
  });

  it('o cuidado feito hoje conta como feito', () => {
    expect(proximoCuidado(banho, [reg(HOJE)], HOJE)).toBe('2026-11-04');
  });

  it('atravessa a virada de mês e de ano', () => {
    expect(proximoCuidado(mensal, [reg('2026-12-15')], '2026-12-20')).toBe('2027-01-14');
  });

  it('sem intervalo, só um agendamento dá previsão', () => {
    expect(proximoCuidado(semIntervalo, [reg('2026-10-10')], HOJE)).toBeNull();
    expect(proximoCuidado(semIntervalo, [reg('2026-10-10'), reg('2026-10-30')], HOJE)).toBe('2026-10-30');
  });

  it('sem nenhum registro, não há previsão', () => {
    expect(proximoCuidado(banho, [], HOJE)).toBeNull();
  });
});

describe('situação do cuidado', () => {
  it('no último dia da janela ainda é "em breve"; um dia depois já é "em dia"', () => {
    // intervalo de 30 dias: janela de 6
    expect(situacaoCuidado(mensal, '2026-10-26', HOJE)).toEqual({ estado: 'em-breve', dias: 6 });
    expect(situacaoCuidado(mensal, '2026-10-27', HOJE)).toEqual({ estado: 'em-dia', dias: 7 });
  });

  it('hoje é "em breve" e ontem já é "atrasada"', () => {
    expect(situacaoCuidado(mensal, HOJE, HOJE)).toEqual({ estado: 'em-breve', dias: 0 });
    expect(situacaoCuidado(mensal, '2026-10-19', HOJE)).toEqual({ estado: 'atrasada', dias: -1 });
  });

  it('sem intervalo, só o próprio dia é "em breve"', () => {
    expect(situacaoCuidado(semIntervalo, HOJE, HOJE).estado).toBe('em-breve');
    expect(situacaoCuidado(semIntervalo, '2026-10-21', HOJE).estado).toBe('em-dia');
  });

  it('sem data, fica "sem previsão"', () => {
    expect(situacaoCuidado(banho, null, HOJE)).toEqual({ estado: 'sem-previsao', dias: null });
  });
});

describe('textos do cartão', () => {
  it('atraso no singular e no plural', () => {
    expect(textoCuidado({ estado: 'atrasada', dias: -1 })).toBe('1 dia além da data');
    expect(textoCuidado({ estado: 'atrasada', dias: -12 })).toBe('12 dias além da data');
  });

  it('hoje, amanhã e daqui a alguns dias', () => {
    expect(textoCuidado({ estado: 'em-breve', dias: 0 })).toBe('Hoje');
    expect(textoCuidado({ estado: 'em-breve', dias: 1 })).toBe('Amanhã');
    expect(textoCuidado({ estado: 'em-dia', dias: 9 })).toBe('Em 9 dias');
  });

  it('sem previsão diferencia quem nunca registrou', () => {
    expect(textoCuidado({ estado: 'sem-previsao', dias: null }, true)).toBe('Sem previsão');
    expect(textoCuidado({ estado: 'sem-previsao', dias: null }, false)).toBe('Ainda não registrado');
  });

  it('"Último" mostra o feito mais recente e ignora os agendados', () => {
    expect(textoUltimo([reg('2026-09-20'), reg('2026-10-05'), reg('2026-10-30')], HOJE)).toBe(
      'Último: 5 out 2026',
    );
    expect(textoUltimo([reg('2026-10-30')], HOJE)).toBe('');
    expect(textoUltimo([], HOJE)).toBe('');
  });
});

describe('tipo de cuidado', () => {
  const tipo = (dados) => new TipoCuidado({ petId: 'pet-1', ...dados });

  it('exige nome de até 40 letras', () => {
    expect(tipo({ nome: '   ' }).validar()).toHaveProperty('nome');
    expect(tipo({ nome: 'x'.repeat(41) }).validar()).toHaveProperty('nome');
    expect(tipo({ nome: 'x'.repeat(40) }).validar()).toEqual({});
  });

  it('intervalo é opcional; se vier, é um número inteiro de 1 a 3650 dias', () => {
    expect(tipo({ nome: 'Banho' }).validar()).toEqual({});
    expect(tipo({ nome: 'Banho', intervaloDias: 1 }).validar()).toEqual({});
    expect(tipo({ nome: 'Banho', intervaloDias: 3650 }).validar()).toEqual({});
    expect(tipo({ nome: 'Banho', intervaloDias: 0 }).validar()).toHaveProperty('intervaloDias');
    expect(tipo({ nome: 'Banho', intervaloDias: 3651 }).validar()).toHaveProperty('intervaloDias');
    expect(tipo({ nome: 'Banho', intervaloDias: 7.5 }).validar()).toHaveProperty('intervaloDias');
  });

  it('grava o nome sem espaços nas pontas, com o ícone padrão se não escolher', () => {
    const t = tipo({ nome: '  Banho  ' });
    expect(t.toRow()).toEqual({ pet_id: 'pet-1', nome: 'Banho', icone: 'sparkles-outline', intervalo_dias: null });
  });

  it('volta do banco igual ao que foi gravado', () => {
    const t = tipo({ nome: 'Tosa', icone: 'cut-outline', intervaloDias: 60 });
    const linha = {
      ...t.toRow(),
      id: t.id,
      criado_em: t.criadoEm,
      atualizado_em: t.atualizadoEm,
      excluido_em: null,
      autor_dispositivo_id: null,
    };
    expect(TipoCuidado.fromRow(linha)).toEqual(t);
  });

  it('as sugestões do catálogo são válidas e não se repetem', () => {
    const nomes = CATALOGO_CUIDADOS.map((c) => c.nome);
    expect(new Set(nomes).size).toBe(nomes.length);
    CATALOGO_CUIDADOS.forEach((c) => expect(tipo(c).validar()).toEqual({}));
  });
});

describe('registro de cuidado', () => {
  it('exige a data', () => {
    expect(new RegistroCuidado({ tipoId: 't-1' }).validar()).toHaveProperty('data');
    expect(new RegistroCuidado({ tipoId: 't-1', data: HOJE }).validar()).toEqual({});
  });

  it('grava local e observação sem espaços nas pontas', () => {
    const r = new RegistroCuidado({ tipoId: 't-1', data: HOJE, local: ' Banho e Cia ', observacao: ' ok ' });
    expect(r.toRow()).toEqual({ tipo_id: 't-1', data: HOJE, local: 'Banho e Cia', observacao: 'ok' });
  });
});
