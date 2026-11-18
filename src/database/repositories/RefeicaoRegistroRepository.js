import { RefeicaoRegistro } from '../../models/RefeicaoRegistro';
import { BaseRepository } from './BaseRepository';

export class RefeicaoRegistroRepository extends BaseRepository {
  tabela = 'refeicoes_registro';

  deLinha(linha) {
    return RefeicaoRegistro.fromRow(linha);
  }

  /** Refeições marcadas em um dia, da mais antiga para a mais nova. */
  doDia(petId, dataISO) {
    return this.db
      .getAllSync(
        `SELECT * FROM refeicoes_registro WHERE pet_id = ? AND data = ? AND excluido_em IS NULL
         ORDER BY criado_em`,
        [petId, dataISO],
      )
      .map((l) => RefeicaoRegistro.fromRow(l));
  }

  /** Marcações do pet entre duas datas (inclusive), para o histórico. */
  doPeriodo(petId, inicioISO, fimISO) {
    return this.db
      .getAllSync(
        `SELECT * FROM refeicoes_registro WHERE pet_id = ? AND data >= ? AND data <= ? AND excluido_em IS NULL
         ORDER BY data, criado_em`,
        [petId, inicioISO, fimISO],
      )
      .map((l) => RefeicaoRegistro.fromRow(l));
  }

  /** Marcações de um dia para todos os pets (para os lembretes). */
  doDiaDeTodos(dataISO) {
    return this.db
      .getAllSync(
        'SELECT * FROM refeicoes_registro WHERE data = ? AND excluido_em IS NULL ORDER BY criado_em',
        [dataISO],
      )
      .map((l) => RefeicaoRegistro.fromRow(l));
  }
}
