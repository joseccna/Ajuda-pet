/**
 * Contrato de lembrete. Todo módulo que gera avisos (vacinas, cuidados, consultas...)
 * devolve objetos neste formato, e o painel do dia junta todos sem conhecer cada módulo.
 *
 * @typedef {Object} Lembrete
 * @property {string} chave    identificador único do lembrete
 * @property {string} petId
 * @property {string} petNome
 * @property {string} titulo   "V8 da Luna"
 * @property {string} texto    "Atrasada, 5 dias"
 * @property {number} dias     dias até a data (negativo = atrasado, 0 = hoje)
 * @property {string} data     data ISO
 * @property {string} icone    nome de ícone Ionicons
 * @property {{pathname: string, params: Object}} rota  para onde ir ao tocar
 */

/** Dias à frente que entram na seção "Próximos" do painel. */
export const DIAS_PROXIMOS = 14;

export function criarLembrete(dados) {
  return { ...dados };
}

/** atrasado | hoje | em-breve (define a cor do lembrete). */
export function estadoDoLembrete(lembrete) {
  if (lembrete.dias < 0) return 'atrasado';
  if (lembrete.dias === 0) return 'hoje';
  return 'em-breve';
}
