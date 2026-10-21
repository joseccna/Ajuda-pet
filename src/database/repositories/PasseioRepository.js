import { Passeio } from '../../models/Passeio';
import { BaseRepository } from './BaseRepository';

export class PasseioRepository extends BaseRepository {
  tabela = 'passeios';

  deLinha(linha) {
    return Passeio.fromRow(linha);
  }

  /** Passeios do pet, do mais recente para o mais antigo. */
  listarPorPet(petId) {
    return this.db
      .getAllSync('SELECT * FROM passeios WHERE pet_id = ? AND excluido_em IS NULL ORDER BY inicio DESC', [
        petId,
      ])
      .map((l) => Passeio.fromRow(l));
  }

  /** Passeio em andamento do pet, se houver. */
  emAndamento(petId) {
    const linha = this.db.getFirstSync(
      'SELECT * FROM passeios WHERE pet_id = ? AND em_andamento = 1 AND excluido_em IS NULL ORDER BY inicio DESC LIMIT 1',
      [petId],
    );
    return linha ? Passeio.fromRow(linha) : null;
  }

  /** Passeios em andamento de pets ativos (lembrete "passeio em andamento"). */
  emAndamentoDePetsAtivos() {
    return this.db
      .getAllSync(
        `SELECT s.* FROM passeios s JOIN pets p ON p.id = s.pet_id
         WHERE s.em_andamento = 1 AND s.excluido_em IS NULL AND p.excluido_em IS NULL AND p.falecido = 0`,
      )
      .map((l) => Passeio.fromRow(l));
  }
}
