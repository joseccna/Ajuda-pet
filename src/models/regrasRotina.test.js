import {
  diasDeRacao,
  horaDoDia,
  horariosDeTexto,
  horariosParaTexto,
  lerHorario,
  normalizarHorarios,
  racaoDiariaG,
  refeicoesDoDia,
  refeicoesParaLembrar,
  textoEstoque,
} from './regrasAlimentacao';
import {
  dataDoPasseio,
  formatarCronometro,
  formatarDuracao,
  inicioDaSemana,
  minutosDeSegundos,
  minutosDoDia,
  percentualMeta,
  segundosDecorridos,
  semanaAtual,
  ultimoPasseio,
} from './regrasPasseio';
import {
  agendados,
  feitos,
  janelaAviso,
  proximoCuidado,
  situacaoCuidado,
  textoCuidado,
  textoUltimo,
} from './regrasCuidado';

const HOJE = '2026-10-02'; // sexta-feira

describe('alimentação: horários', () => {
  it('lê hh:mm', () => {
    expect(lerHorario('08:00')).toEqual({ horario: '08:00' });
    expect(lerHorario('24:00').erro).toBeDefined();
    expect(lerHorario('8:00').erro).toBeDefined();
    expect(lerHorario('').erro).toBeDefined();
  });
  it('tira repetidos e ordena', () => {
    expect(normalizarHorarios(['19:00', '08:00', '19:00'])).toEqual(['08:00', '19:00']);
  });
  it('vai e volta entre lista e texto', () => {
    expect(horariosParaTexto(['08:00', '19:00'])).toBe('08:00,19:00');
    expect(horariosDeTexto('08:00,19:00')).toEqual(['08:00', '19:00']);
    expect(horariosDeTexto('')).toEqual([]);
  });
});

describe('alimentação: estoque', () => {
  const plano = { quantidadeG: 150, horarios: ['08:00', '19:00'], sacoG: 15000, sacoAbertoEm: '2026-09-20' };
  it('calcula a ração por dia', () => {
    expect(racaoDiariaG(plano)).toBe(300);
  });
  it('estima quantos dias o saco ainda dura', () => {
    // 15000 / 300 = 50 dias no total; abriu há 12 dias => restam 38
    expect(diasDeRacao(plano, HOJE)).toBe(38);
    expect(textoEstoque(plano, HOJE)).toBe('Saco de 15 kg, dura cerca de 38 dias');
  });
  it('avisa quando está acabando e nunca fica negativo', () => {
    const velho = { ...plano, sacoAbertoEm: '2026-06-01' };
    expect(diasDeRacao(velho, HOJE)).toBe(0);
    expect(textoEstoque(velho, HOJE)).toBe('Saco de 15 kg: a ração está acabando');
  });
  it('sem saco ou sem data de abertura, não estima', () => {
    expect(diasDeRacao({ ...plano, sacoG: null }, HOJE)).toBeNull();
    expect(diasDeRacao({ ...plano, sacoAbertoEm: null }, HOJE)).toBeNull();
    expect(textoEstoque({ ...plano, sacoG: null }, HOJE)).toBe('');
  });
});

describe('alimentação: refeições do dia', () => {
  const plano = { horarios: ['08:00', '13:00', '19:00'] };
  const agora = new Date(2026, 9, 2, 14, 30);
  it('marca feitas e as que já passaram', () => {
    const r = refeicoesDoDia(plano, [{ horario: '08:00', id: 'a' }], agora);
    expect(r.map((x) => [x.horario, x.feita, x.passou])).toEqual([
      ['08:00', true, true],
      ['13:00', false, true],
      ['19:00', false, false],
    ]);
    expect(r[0].registro.id).toBe('a');
  });
  it('lembra do que está pendente e passou, ou chega na próxima hora', () => {
    const r = refeicoesDoDia(plano, [{ horario: '08:00' }], agora);
    expect(refeicoesParaLembrar(r, agora).map((x) => x.horario)).toEqual(['13:00']);
    const quaseNoite = new Date(2026, 9, 2, 18, 15);
    expect(
      refeicoesParaLembrar(refeicoesDoDia(plano, [], quaseNoite), quaseNoite).map((x) => x.horario),
    ).toEqual(['08:00', '13:00', '19:00']);
  });
  it('de manhã cedo não lembra das refeições do resto do dia', () => {
    const cedo = new Date(2026, 9, 2, 6, 0);
    expect(refeicoesParaLembrar(refeicoesDoDia(plano, [], cedo), cedo)).toEqual([]);
  });
  it('perto da meia-noite não passa de 23:59', () => {
    const tarde = new Date(2026, 9, 2, 23, 30);
    expect(refeicoesParaLembrar(refeicoesDoDia({ horarios: ['23:45'] }, [], tarde), tarde)).toHaveLength(1);
    expect(horaDoDia(new Date(2026, 9, 2, 7, 5))).toBe('07:05');
  });
});

describe('passeios: cronômetro', () => {
  const t = (h, m, s = 0) => new Date(2026, 9, 2, h, m, s).toISOString();
  it('conta o tempo desde o início', () => {
    const p = { inicio: t(18, 0), fim: null, pausaTotalS: 0, pausadoDesde: null };
    expect(segundosDecorridos(p, new Date(2026, 9, 2, 18, 24, 35).getTime())).toBe(1475);
  });
  it('desconta as pausas já feitas e a pausa em andamento', () => {
    const p = { inicio: t(18, 0), fim: null, pausaTotalS: 120, pausadoDesde: null };
    expect(segundosDecorridos(p, new Date(2026, 9, 2, 18, 10).getTime())).toBe(480);
    const pausado = { ...p, pausadoDesde: t(18, 8) };
    // 10 min corridos - 2 min de pausa antiga - 2 min da pausa atual
    expect(segundosDecorridos(pausado, new Date(2026, 9, 2, 18, 10).getTime())).toBe(360);
  });
  it('passeio concluído usa o fim', () => {
    const p = { inicio: t(18, 0), fim: t(18, 30), pausaTotalS: 0, pausadoDesde: null };
    expect(segundosDecorridos(p, new Date(2026, 9, 3, 12).getTime())).toBe(1800);
  });
  it('formata o cronômetro e a duração', () => {
    expect(formatarCronometro(1475)).toBe('00:24:35');
    expect(formatarCronometro(3725)).toBe('01:02:05');
    expect(formatarDuracao(32)).toBe('32 min');
    expect(formatarDuracao(100)).toBe('1h40');
    expect(formatarDuracao(60)).toBe('1h');
    expect(minutosDeSegundos(10)).toBe(1);
    expect(minutosDeSegundos(1475)).toBe(25);
  });
});

describe('passeios: semana e meta', () => {
  // mes: 8 = setembro, 9 = outubro (como no Date do JavaScript)
  const passeio = (mes, dia, hora, duracaoMin, extra = {}) => ({
    inicio: new Date(2026, mes, dia, hora, 0).toISOString(),
    duracaoMin,
    emAndamento: false,
    ...extra,
  });
  const lista = [
    passeio(8, 28, 18, 30),
    passeio(8, 29, 7, 20),
    passeio(8, 29, 18, 25),
    passeio(9, 2, 8, 20),
    passeio(9, 1, 9, 99, { emAndamento: true }),
  ];

  it('a semana começa na segunda', () => {
    expect(inicioDaSemana('2026-10-02')).toBe('2026-09-28');
    expect(inicioDaSemana('2026-09-28')).toBe('2026-09-28');
    expect(inicioDaSemana('2026-10-04')).toBe('2026-09-28'); // domingo
    expect(inicioDaSemana('2026-10-05')).toBe('2026-10-05');
  });
  it('soma os minutos por dia, ignora o passeio em andamento e marca hoje e o futuro', () => {
    const s = semanaAtual(lista, HOJE);
    expect(s.dias.map((d) => d.minutos)).toEqual([30, 45, 0, 0, 20, 0, 0]);
    expect(s.totalMin).toBe(95);
    expect(s.dias[4].hoje).toBe(true);
    expect(s.dias[5].futuro).toBe(true);
    expect(s.dias[3].futuro).toBe(false);
    expect(s.dias.map((d) => d.rotulo).join(' ')).toBe('Seg Ter Qua Qui Sex Sáb Dom');
  });
  it('calcula a meta do dia sem passar de 100%', () => {
    expect(percentualMeta(20)).toBe(67);
    expect(percentualMeta(30)).toBe(100);
    expect(percentualMeta(90)).toBe(100);
    expect(minutosDoDia(lista, '2026-09-29')).toBe(45);
    expect(dataDoPasseio(lista[3])).toBe('2026-10-02');
  });
  it('acha o último passeio concluído', () => {
    expect(ultimoPasseio(lista).inicio).toBe(lista[3].inicio);
    expect(ultimoPasseio([])).toBeNull();
  });
});

describe('cuidados', () => {
  const banho = { intervaloDias: 15 };
  const r = (data) => ({ data });

  it('a janela de aviso é 20% do intervalo, entre 2 e 7 dias', () => {
    expect(janelaAviso(15)).toBe(3);
    expect(janelaAviso(7)).toBe(2);
    expect(janelaAviso(60)).toBe(7);
    expect(janelaAviso(365)).toBe(7);
    expect(janelaAviso(null)).toBe(0);
  });
  it('separa o que já foi feito do que está agendado', () => {
    const regs = [r('2026-09-10'), r('2026-09-20'), r('2026-10-10'), r('2026-10-05')];
    expect(feitos(regs, HOJE).map((x) => x.data)).toEqual(['2026-09-20', '2026-09-10']);
    expect(agendados(regs, HOJE).map((x) => x.data)).toEqual(['2026-10-05', '2026-10-10']);
  });
  it('a próxima data é o agendamento mais próximo ou o último feito mais o intervalo', () => {
    expect(proximoCuidado(banho, [r('2026-09-20')], HOJE)).toBe('2026-10-05');
    expect(proximoCuidado(banho, [r('2026-09-20'), r('2026-10-03')], HOJE)).toBe('2026-10-03');
    expect(proximoCuidado(banho, [], HOJE)).toBeNull();
    expect(proximoCuidado({ intervaloDias: null }, [r('2026-09-20')], HOJE)).toBeNull();
  });
  it('a situação segue os mesmos estados da carteirinha', () => {
    expect(situacaoCuidado(banho, '2026-09-29', HOJE)).toEqual({ estado: 'atrasada', dias: -3 });
    expect(situacaoCuidado(banho, '2026-10-04', HOJE)).toEqual({ estado: 'em-breve', dias: 2 });
    expect(situacaoCuidado(banho, '2026-10-12', HOJE)).toEqual({ estado: 'em-dia', dias: 10 });
    expect(situacaoCuidado(banho, null, HOJE)).toEqual({ estado: 'sem-previsao', dias: null });
  });
  it('os textos servem para qualquer gênero', () => {
    expect(textoCuidado({ estado: 'atrasada', dias: -3 })).toBe('3 dias além da data');
    expect(textoCuidado({ estado: 'atrasada', dias: -1 })).toBe('1 dia além da data');
    expect(textoCuidado({ estado: 'em-breve', dias: 0 })).toBe('Hoje');
    expect(textoCuidado({ estado: 'em-breve', dias: 1 })).toBe('Amanhã');
    expect(textoCuidado({ estado: 'em-dia', dias: 10 })).toBe('Em 10 dias');
    expect(textoCuidado({ estado: 'sem-previsao', dias: null }, false)).toBe('Ainda não registrado');
    expect(textoCuidado({ estado: 'sem-previsao', dias: null }, true)).toBe('Sem previsão');
    expect(textoUltimo([r('2026-09-20')], HOJE)).toBe('Último: 20 set 2026');
    expect(textoUltimo([], HOJE)).toBe('');
  });
});
