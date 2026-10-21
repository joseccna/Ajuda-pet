import { DeviceIdentity } from '../DeviceIdentity';
import { MarcacaoPasseio } from '../../models/MarcacaoPasseio';
import { BaseRepository } from './BaseRepository';

export class MarcacaoPasseioRepository extends BaseRepository {
  tabela = 'marcacoes_passeio';

  deLinha(linha) {
    return MarcacaoPasseio.fromRow(linha);
  }

  listarPorPasseio(passeioId) {
    return this.db
      .getAllSync(
        'SELECT * FROM marcacoes_passeio WHERE passeio_id = ? AND excluido_em IS NULL ORDER BY horario',
        [passeioId],
      )
      .map((l) => MarcacaoPasseio.fromRow(l));
  }

  excluirPorPasseio(passeioId) {
    const agora = new Date().toISOString();
    this.db.runSync(
      `UPDATE marcacoes_passeio SET excluido_em = ?, atualizado_em = ?, autor_dispositivo_id = ?
       WHERE passeio_id = ? AND excluido_em IS NULL`,
      [agora, agora, DeviceIdentity.id, passeioId],
    );
  }
}
