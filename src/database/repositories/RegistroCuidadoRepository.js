import { RegistroCuidado } from '../../models/RegistroCuidado';
import { DeviceIdentity } from '../DeviceIdentity';
import { BaseRepository } from './BaseRepository';

export class RegistroCuidadoRepository extends BaseRepository {
  tabela = 'registros_cuidado';

  deLinha(linha) {
    return RegistroCuidado.fromRow(linha);
  }

  /** Registros de todos os tipos de um pet, do mais recente para o mais antigo. */
  listarPorPet(petId) {
    return this.db
      .getAllSync(
        `SELECT r.* FROM registros_cuidado r JOIN tipos_cuidado t ON t.id = r.tipo_id
         WHERE t.pet_id = ? AND r.excluido_em IS NULL AND t.excluido_em IS NULL
         ORDER BY r.data DESC, r.criado_em DESC`,
        [petId],
      )
      .map((l) => RegistroCuidado.fromRow(l));
  }

  /** Exclui o registro e o valor privado dele. */
  excluirComDependencias(id) {
    const agora = new Date().toISOString();
    this.db.runSync(
      `UPDATE cuidados_privados SET excluido_em = ?, atualizado_em = ?, autor_dispositivo_id = ?
       WHERE registro_id = ? AND excluido_em IS NULL`,
      [agora, agora, DeviceIdentity.id, id],
    );
    this.excluir(id);
  }
}
