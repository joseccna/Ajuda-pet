import { LembreteAvulso } from '../../models/LembreteAvulso';
import { BaseRepository } from './BaseRepository';

export class LembreteAvulsoRepository extends BaseRepository {
  tabela = 'lembretes_avulsos';

  deLinha(linha) {
    return LembreteAvulso.fromRow(linha);
  }

  /** Lembretes pendentes de pets ativos (os concluídos e os de pets excluídos ou em memorial ficam de fora). */
  pendentesDePetsAtivos() {
    return this.db
      .getAllSync(
        `SELECT a.* FROM lembretes_avulsos a JOIN pets p ON p.id = a.pet_id
         WHERE a.excluido_em IS NULL AND a.concluido_em IS NULL
           AND p.excluido_em IS NULL AND p.falecido = 0
         ORDER BY a.data, a.hora`,
      )
      .map((l) => LembreteAvulso.fromRow(l));
  }
}
