import { DoseVacina } from '../../models/DoseVacina';
import { DeviceIdentity } from '../DeviceIdentity';
import { BaseRepository } from './BaseRepository';

export class DoseVacinaRepository extends BaseRepository {
  tabela = 'doses_vacina';

  deLinha(linha) {
    return DoseVacina.fromRow(linha);
  }

  /** Todas as doses de um pet (de todos os tipos), da mais recente para a mais antiga. */
  listarPorPet(petId) {
    return this.db
      .getAllSync(
        `SELECT d.* FROM doses_vacina d
         JOIN tipos_vacina t ON t.id = d.tipo_id
         WHERE t.pet_id = ? AND d.excluido_em IS NULL AND t.excluido_em IS NULL
         ORDER BY d.data_aplicacao DESC`,
        [petId],
      )
      .map((l) => DoseVacina.fromRow(l));
  }

  /** Exclusão lógica de todas as doses de um tipo. */
  excluirPorTipo(tipoId) {
    const agora = new Date().toISOString();
    this.db.runSync(
      `UPDATE doses_vacina SET excluido_em = ?, atualizado_em = ?, autor_dispositivo_id = ?
       WHERE tipo_id = ? AND excluido_em IS NULL`,
      [agora, agora, DeviceIdentity.id, tipoId],
    );
  }
}
