import { novoId } from '../utils/id';
import { Database } from './Database';
/**
 * Identidade deste aparelho. Cada instalação gera um id na primeira abertura.
 * Ele é gravado nos registros (autor) e será usado no pareamento e na sincronização.
 */
export class DeviceIdentity {
  static {
    this._id = null;
  }
  static get id() {
    if (!DeviceIdentity._id) throw new Error('DeviceIdentity.iniciar() ainda não foi chamado');
    return DeviceIdentity._id;
  }
  static iniciar() {
    const db = Database.get();
    const existente = db.getFirstSync(
      'SELECT id FROM dispositivos WHERE eh_este_aparelho = 1 AND excluido_em IS NULL',
    );
    if (existente) {
      DeviceIdentity._id = existente.id;
      return;
    }
    const id = novoId();
    const agora = new Date().toISOString();
    db.runSync(
      `INSERT INTO dispositivos (id, apelido, eh_este_aparelho, criado_em, atualizado_em)
       VALUES (?, ?, 1, ?, ?)`,
      [id, 'Este aparelho', agora, agora],
    );
    DeviceIdentity._id = id;
  }
}
