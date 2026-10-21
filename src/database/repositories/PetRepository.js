import { Pet } from '../../models/Pet';
import { BaseRepository } from './BaseRepository';
export class PetRepository extends BaseRepository {
  constructor() {
    super(...arguments);
    this.tabela = 'pets';
  }
  deLinha(linha) {
    return Pet.fromRow(linha);
  }
  /** Pets que estão com o tutor, em ordem alfabética. */
  listarAtivos() {
    return this.db
      .getAllSync(
        'SELECT * FROM pets WHERE falecido = 0 AND excluido_em IS NULL ORDER BY nome COLLATE NOCASE',
      )
      .map((l) => Pet.fromRow(l));
  }
  /** Pets em memorial. */
  listarMemorial() {
    return this.db
      .getAllSync(
        'SELECT * FROM pets WHERE falecido = 1 AND excluido_em IS NULL ORDER BY nome COLLATE NOCASE',
      )
      .map((l) => Pet.fromRow(l));
  }
  /** Já existe outro pet com esse nome? (ignora maiúsculas e o próprio pet) */
  existeNome(nome, ignorarId) {
    const linha = this.db.getFirstSync(
      `SELECT 1 AS x FROM pets
       WHERE lower(nome) = lower(?) AND excluido_em IS NULL AND id != ?`,
      [nome.trim(), ignorarId ?? ''],
    );
    return linha !== null;
  }
}
