import { Tutor } from '../../models/Tutor';
import { BaseRepository } from './BaseRepository';

export class TutorRepository extends BaseRepository {
  tabela = 'tutores';

  deLinha(linha) {
    return Tutor.fromRow(linha);
  }

  /** O perfil deste aparelho (há um só). */
  atual() {
    const linha = this.db.getFirstSync(
      'SELECT * FROM tutores WHERE excluido_em IS NULL ORDER BY criado_em LIMIT 1',
    );
    return linha ? Tutor.fromRow(linha) : null;
  }
}
