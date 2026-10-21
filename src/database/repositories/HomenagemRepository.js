import { Homenagem } from '../../models/Homenagem';
import { BaseRepository } from './BaseRepository';

export class HomenagemRepository extends BaseRepository {
  tabela = 'homenagens';

  deLinha(linha) {
    return Homenagem.fromRow(linha);
  }

  /** A homenagem mais recente do pet. */
  doPet(petId) {
    const linha = this.db.getFirstSync(
      'SELECT * FROM homenagens WHERE pet_id = ? AND excluido_em IS NULL ORDER BY atualizado_em DESC LIMIT 1',
      [petId],
    );
    return linha ? Homenagem.fromRow(linha) : null;
  }
}
