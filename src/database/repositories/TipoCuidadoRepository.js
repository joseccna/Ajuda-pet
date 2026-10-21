import { TipoCuidado } from '../../models/TipoCuidado';
import { DeviceIdentity } from '../DeviceIdentity';
import { BaseRepository } from './BaseRepository';

export class TipoCuidadoRepository extends BaseRepository {
  tabela = 'tipos_cuidado';

  deLinha(linha) {
    return TipoCuidado.fromRow(linha);
  }

  listarPorPet(petId) {
    return this.db
      .getAllSync(
        'SELECT * FROM tipos_cuidado WHERE pet_id = ? AND excluido_em IS NULL ORDER BY nome COLLATE NOCASE',
        [petId],
      )
      .map((l) => TipoCuidado.fromRow(l));
  }

  existeNome(petId, nome, ignorarId) {
    const linha = this.db.getFirstSync(
      `SELECT 1 AS x FROM tipos_cuidado
       WHERE pet_id = ? AND lower(nome) = lower(?) AND excluido_em IS NULL AND id != ?`,
      [petId, nome.trim(), ignorarId ?? ''],
    );
    return linha !== null;
  }

  /** Exclui o tipo e tudo que depende dele (registros e valores privados). */
  excluirComDependencias(id) {
    const agora = new Date().toISOString();
    const quem = DeviceIdentity.id;
    this.db.runSync(
      `UPDATE cuidados_privados SET excluido_em = ?, atualizado_em = ?, autor_dispositivo_id = ?
       WHERE excluido_em IS NULL AND registro_id IN (SELECT id FROM registros_cuidado WHERE tipo_id = ?)`,
      [agora, agora, quem, id],
    );
    this.db.runSync(
      `UPDATE registros_cuidado SET excluido_em = ?, atualizado_em = ?, autor_dispositivo_id = ?
       WHERE tipo_id = ? AND excluido_em IS NULL`,
      [agora, agora, quem, id],
    );
    this.excluir(id);
  }
}
