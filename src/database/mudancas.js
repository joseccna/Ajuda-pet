/**
 * Avisa quem quiser saber que algum dado foi gravado ou excluído no banco.
 * As notificações usam isso para agendar de novo depois de qualquer mudança
 * (um lembrete novo, uma dose registrada, um cuidado excluído...), venha de qual tela vier.
 */
const ouvintes = new Set();

export const mudancas = {
  /** Chama ouvinte(tabela) a cada gravação. Devolve uma função para parar de ouvir. */
  assinar(ouvinte) {
    ouvintes.add(ouvinte);
    return () => ouvintes.delete(ouvinte);
  },
  avisar(tabela) {
    for (const ouvinte of ouvintes) {
      try {
        ouvinte(tabela);
      } catch {
        // Um ouvinte com problema não impede a gravação nem os outros ouvintes.
      }
    }
  },
};
