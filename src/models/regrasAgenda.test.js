import {
  agruparPorDia,
  corDoPonto,
  criarEvento,
  estadoPorData,
  filtrarPorPet,
  gradeDoMes,
  iconeDoTipo,
  mudarMes,
  ocorrenciasNoIntervalo,
  planejarNotificacoes,
  pontosDoDia,
  proximaData,
  textoDias,
} from './regrasAgenda';
import { somarMeses, tituloDoDia } from '../utils/datas';

const HOJE = '2026-10-02';

describe('datas do calendário', () => {
  it('soma meses sem estourar o fim do mês', () => {
    expect(somarMeses('2026-01-31', 1)).toBe('2026-02-28');
    expect(somarMeses('2024-01-31', 1)).toBe('2024-02-29');
    expect(somarMeses('2026-10-18', 3)).toBe('2027-01-18');
    expect(somarMeses('2026-10-18', 12)).toBe('2027-10-18');
    expect(somarMeses('2026-03-15', -3)).toBe('2025-12-15');
  });
  it('monta o título do dia', () => {
    expect(tituloDoDia('2026-10-02')).toBe('Sexta, 2 de outubro');
    expect(tituloDoDia('2026-09-27')).toBe('Domingo, 27 de setembro');
  });
});

describe('repetição', () => {
  it('calcula a próxima data', () => {
    expect(proximaData('2026-10-02', '15d')).toBe('2026-10-17');
    expect(proximaData('2026-10-02', 'mensal')).toBe('2026-11-02');
    expect(proximaData('2026-10-02', '3m')).toBe('2027-01-02');
    expect(proximaData('2026-10-02', 'anual')).toBe('2027-10-02');
    expect(proximaData('2026-10-02', 'nao')).toBeNull();
  });
  it('lista as ocorrências dentro do intervalo', () => {
    expect(ocorrenciasNoIntervalo('2026-10-02', 'nao', '2026-10-01', '2026-10-31')).toEqual(['2026-10-02']);
    expect(ocorrenciasNoIntervalo('2026-10-02', 'nao', '2026-11-01', '2026-11-30')).toEqual([]);
    expect(ocorrenciasNoIntervalo('2026-10-02', '15d', '2026-10-01', '2026-11-10')).toEqual([
      '2026-10-02',
      '2026-10-17',
      '2026-11-01',
    ]);
    // começou antes do intervalo: só as que caem dentro
    expect(ocorrenciasNoIntervalo('2026-08-02', 'mensal', '2026-10-01', '2026-10-31')).toEqual([
      '2026-10-02',
    ]);
  });
});

describe('estado e cores', () => {
  it('classifica por data', () => {
    expect(estadoPorData('2026-09-27', HOJE)).toBe('atrasado');
    expect(estadoPorData('2026-09-27', HOJE, false)).toBe('passado');
    expect(estadoPorData(HOJE, HOJE)).toBe('hoje');
    expect(estadoPorData('2026-10-18', HOJE)).toBe('futuro');
  });
  it('dá uma cor por estado e junta as cores do dia sem repetir', () => {
    expect(corDoPonto('atrasado')).toBe('coral');
    expect(corDoPonto('hoje')).toBe('verde');
    expect(corDoPonto('futuro')).toBe('ambar');
    expect(corDoPonto('passado')).toBe('neutro');
    const eventos = [{ estado: 'futuro' }, { estado: 'atrasado' }, { estado: 'futuro' }, { estado: 'hoje' }];
    expect(pontosDoDia(eventos)).toEqual(['coral', 'verde', 'ambar']);
  });
  it('descreve os dias em texto', () => {
    expect(textoDias(-5)).toBe('5 dias além da data');
    expect(textoDias(0, '14:30')).toBe('Hoje, 14:30');
    expect(textoDias(1)).toBe('Amanhã');
    expect(textoDias(16)).toBe('Em 16 dias');
    expect(iconeDoTipo('banho')).toBe('water-outline');
    expect(iconeDoTipo('xyz')).toBe('notifications-outline');
  });
});

describe('grade do mês', () => {
  it('outubro de 2026 começa em 27 de setembro (domingo) e termina em 31 de outubro (sábado)', () => {
    const g = gradeDoMes(2026, 9);
    expect(g).toHaveLength(35);
    expect(g[0]).toEqual({ data: '2026-09-27', doMes: false, numero: 27 });
    expect(g[4]).toEqual({ data: '2026-10-01', doMes: true, numero: 1 });
    expect(g[34]).toEqual({ data: '2026-10-31', doMes: true, numero: 31 });
    expect(g.filter((d) => d.doMes)).toHaveLength(31);
  });
  it('meses que precisam de seis semanas', () => {
    const g = gradeDoMes(2026, 2); // março de 2026 começa num domingo e tem 31 dias
    expect(g.length % 7).toBe(0);
    expect(g[0].data).toBe('2026-03-01');
    expect(g[g.length - 1].data).toBe('2026-04-04');
  });
  it('fevereiro que cabe em quatro semanas', () => {
    const g = gradeDoMes(2026, 1); // fevereiro de 2026: começa no domingo, 28 dias
    expect(g).toHaveLength(28);
  });
  it('troca de mês virando o ano', () => {
    expect(mudarMes({ ano: 2026, mes: 11 }, 1)).toEqual({ ano: 2027, mes: 0 });
    expect(mudarMes({ ano: 2026, mes: 0 }, -1)).toEqual({ ano: 2025, mes: 11 });
  });
});

describe('agrupar e filtrar', () => {
  const e = (chave, petId, data, hora = '', titulo = chave) =>
    criarEvento({ chave, petId, data, hora, titulo });
  const lista = [
    e('b', 'luna', '2026-10-02', '18:00'),
    e('a', 'thor', '2026-10-02', '08:00'),
    e('c', 'luna', '2026-10-02'),
    e('d', 'luna', '2026-10-03'),
  ];
  it('agrupa por dia e ordena por hora, deixando os sem hora por último', () => {
    const g = agruparPorDia(lista);
    expect(Object.keys(g)).toEqual(['2026-10-02', '2026-10-03']);
    expect(g['2026-10-02'].map((x) => x.chave)).toEqual(['a', 'b', 'c']);
  });
  it('filtra por pet', () => {
    expect(filtrarPorPet(lista, 'todos')).toHaveLength(4);
    expect(filtrarPorPet(lista, 'thor').map((x) => x.chave)).toEqual(['a']);
  });
});

describe('planejarNotificacoes', () => {
  const agora = new Date(2026, 9, 2, 12, 0);
  const ev = (chave, data, extra = {}) =>
    criarEvento({ chave, titulo: chave, data, estado: estadoPorData(data, HOJE), ...extra });

  it('agenda o aviso do dia e o de antecedência, nos horários certos', () => {
    const plano = planejarNotificacoes([ev('v8', '2026-10-18')], agora);
    expect(plano.map((p) => [p.chave, p.quando.getTime(), p.corpo])).toEqual([
      ['v8|2026-10-18|antes', new Date(2026, 9, 15, 9, 0).getTime(), 'Em 3 dias'],
      ['v8|2026-10-18|dia', new Date(2026, 9, 18, 9, 0).getTime(), 'É hoje'],
    ]);
  });
  it('com hora, o aviso do dia vem uma hora antes', () => {
    const plano = planejarNotificacoes(
      [ev('consulta', '2026-10-15', { hora: '14:30', antecedenciaDias: 1 })],
      agora,
    );
    expect(plano.map((p) => [p.quando.getTime(), p.corpo])).toEqual([
      [new Date(2026, 9, 14, 9, 0).getTime(), 'Amanhã às 14:30'],
      [new Date(2026, 9, 15, 13, 30).getTime(), 'Hoje às 14:30'],
    ]);
  });
  it('antecedência zero só avisa no dia', () => {
    const plano = planejarNotificacoes([ev('x', '2026-10-20', { antecedenciaDias: 0 })], agora);
    expect(plano).toHaveLength(1);
    expect(plano[0].chave).toBe('x|2026-10-20|dia');
  });
  it('ignora atrasados, passados e horários que já passaram', () => {
    const lista = [
      ev('atrasado', '2026-09-27'),
      ev('passado', '2026-09-03', { estado: 'passado' }),
      ev('hoje-cedo', '2026-10-02', { hora: '10:00' }), // aviso era 09:00, já passou
      ev('hoje-tarde', '2026-10-02', { hora: '18:00' }), // aviso às 17:00
    ];
    expect(planejarNotificacoes(lista, agora).map((p) => p.chave)).toEqual(['hoje-tarde|2026-10-02|dia']);
  });
  it('um aviso 1 hora antes de um evento à 00:30 cai na noite anterior', () => {
    const plano = planejarNotificacoes(
      [ev('madrugada', '2026-10-05', { hora: '00:30', antecedenciaDias: 0 })],
      agora,
    );
    expect(plano[0].quando.getTime()).toBe(new Date(2026, 9, 4, 23, 30).getTime());
  });
  it('ordena por horário e corta no limite', () => {
    const lista = ['2026-10-30', '2026-10-10', '2026-10-20'].map((d) => ev(d, d, { antecedenciaDias: 0 }));
    const plano = planejarNotificacoes(lista, agora, { limite: 2 });
    expect(plano.map((p) => p.chave)).toEqual(['2026-10-10|2026-10-10|dia', '2026-10-20|2026-10-20|dia']);
  });
  it('leva a rota junto para abrir a tela certa ao tocar', () => {
    const rota = { pathname: '/pet/[id]', params: { id: 'p1' } };
    expect(planejarNotificacoes([ev('r', '2026-10-18', { rota })], agora)[0].rota).toEqual(rota);
  });
});
