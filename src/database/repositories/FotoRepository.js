import { Foto } from '../../models/Foto';
import { DeviceIdentity } from '../DeviceIdentity';
import { BaseRepository } from './BaseRepository';

export class FotoRepository extends BaseRepository {
  tabela = 'fotos';

  deLinha(linha) {
    return Foto.fromRow(linha);
  }

  /** Fotos do pet, da mais recente para a mais antiga. */
  listarPorPet(petId) {
    return this.db
      .getAllSync(
        'SELECT * FROM fotos WHERE pet_id = ? AND excluido_em IS NULL ORDER BY data DESC, criado_em DESC',
        [petId],
      )
      .map((l) => Foto.fromRow(l));
  }

  /** Alguma foto ativa usa este arquivo? */
  uriEmUso(uri) {
    return (
      this.db.getFirstSync('SELECT 1 AS x FROM fotos WHERE uri = ? AND excluido_em IS NULL', [uri]) !== null
    );
  }

  buscarPorUri(petId, uri) {
    const linha = this.db.getFirstSync(
      'SELECT * FROM fotos WHERE pet_id = ? AND uri = ? AND excluido_em IS NULL',
      [petId, uri],
    );
    return linha ? Foto.fromRow(linha) : null;
  }

  contarPorPet(petId) {
    return Number(
      this.db.getFirstSync('SELECT COUNT(*) AS n FROM fotos WHERE pet_id = ? AND excluido_em IS NULL', [
        petId,
      ]).n,
    );
  }

  /** Exclusão lógica de vários ids de uma vez. */
  excluirVarias(ids) {
    const agora = new Date().toISOString();
    for (const id of ids) {
      this.db.runSync(
        'UPDATE fotos SET excluido_em = ?, atualizado_em = ?, autor_dispositivo_id = ? WHERE id = ?',
        [agora, agora, DeviceIdentity.id, id],
      );
    }
  }
}
