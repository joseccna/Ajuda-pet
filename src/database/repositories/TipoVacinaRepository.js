import { TipoVacina } from '../../models/TipoVacina';
import { BaseRepository } from './BaseRepository';

export class TipoVacinaRepository extends BaseRepository {
  tabela = 'tipos_vacina';

  deLinha(linha) {
    return TipoVacina.fromRow(linha);
  }

  listarPorPet(petId) {
    return this.db
      .getAllSync(
        'SELECT * FROM tipos_vacina WHERE pet_id = ? AND excluido_em IS NULL ORDER BY nome COLLATE NOCASE',
        [petId],
      )
      .map((l) => TipoVacina.fromRow(l));
  }

  existeNome(petId, nome, ignorarId) {
    const linha = this.db.getFirstSync(
      `SELECT 1 AS x FROM tipos_vacina
       WHERE pet_id = ? AND lower(nome) = lower(?) AND excluido_em IS NULL AND id != ?`,
      [petId, nome.trim(), ignorarId ?? ''],
    );
    return linha !== null;
  }
}
