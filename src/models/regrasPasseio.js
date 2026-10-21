import { deISO, paraISO, somarDias } from '../utils/datas';

/** Passeios: cronômetro, duração, semana e meta. Funções puras. */

/** Meta diária de passeio padrão, em minutos. O tutor pode mudar nas preferências. */
export const META_DIARIA_MIN = 30;

export const MARCACOES = [
  { tipo: 'xixi', rotulo: 'Xixi' },
  { tipo: 'coco', rotulo: 'Cocô' },
  { tipo: 'brincou', rotulo: 'Brincou' },
  { tipo: 'cansado', rotulo: 'Cansado' },
];

const DIAS_SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

/**
 * Segundos de passeio, sem contar as pausas. Usa só os horários guardados, então a conta
 * continua certa com o app em segundo plano, com a tela bloqueada ou até depois de fechar o app.
 */
export function segundosDecorridos(passeio, agoraMs) {
  const inicio = new Date(passeio.inicio).getTime();
  const fim = passeio.fim ? new Date(passeio.fim).getTime() : agoraMs;
  let pausa = (passeio.pausaTotalS ?? 0) * 1000;
  if (passeio.pausadoDesde && !passeio.fim) pausa += agoraMs - new Date(passeio.pausadoDesde).getTime();
  return Math.max(0, Math.floor((fim - inicio - pausa) / 1000));
}

/** 1475 segundos em "00:24:35". */
export function formatarCronometro(segundos) {
  const dois = (n) => String(n).padStart(2, '0');
  return `${dois(Math.floor(segundos / 3600))}:${dois(Math.floor(segundos / 60) % 60)}:${dois(segundos % 60)}`;
}

/** 32 em "32 min"; 100 em "1h40"; 60 em "1h". */
export function formatarDuracao(minutos) {
  if (minutos < 60) return `${minutos} min`;
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
}

/** Duração em minutos de um passeio que termina agora: no mínimo 1. */
export function minutosDeSegundos(segundos) {
  return Math.max(1, Math.round(segundos / 60));
}

/** Data (local) em que o passeio começou. */
export function dataDoPasseio(passeio) {
  return paraISO(new Date(passeio.inicio));
}

/** Segunda-feira da semana de uma data. */
export function inicioDaSemana(dataISO) {
  const diaDaSemana = deISO(dataISO).getDay(); // 0 = domingo
  return somarDias(dataISO, -((diaDaSemana + 6) % 7));
}

/** Minutos de passeio concluídos em um dia. */
export function minutosDoDia(passeios, dataISO) {
  return passeios
    .filter((p) => !p.emAndamento && dataDoPasseio(p) === dataISO)
    .reduce((soma, p) => soma + (p.duracaoMin ?? 0), 0);
}

/** Os sete dias da semana (segunda a domingo) com os minutos de cada um. */
export function semanaAtual(passeios, hojeISO, metaMin = META_DIARIA_MIN) {
  const segunda = inicioDaSemana(hojeISO);
  const dias = DIAS_SEMANA.map((rotulo, i) => {
    const data = somarDias(segunda, i);
    return {
      rotulo,
      data,
      minutos: minutosDoDia(passeios, data),
      hoje: data === hojeISO,
      futuro: data > hojeISO,
    };
  });
  return { dias, totalMin: dias.reduce((s, d) => s + d.minutos, 0), metaMin };
}

/** Quanto da meta do dia foi cumprido, de 0 a 100. */
export function percentualMeta(minutos, meta = META_DIARIA_MIN) {
  return Math.min(100, Math.round((minutos / meta) * 100));
}

/** Passeio mais recente já concluído. */
export function ultimoPasseio(passeios) {
  const concluidos = passeios.filter((p) => !p.emAndamento);
  if (concluidos.length === 0) return null;
  return [...concluidos].sort((a, b) => (a.inicio < b.inicio ? 1 : -1))[0];
}
