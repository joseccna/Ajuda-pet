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
