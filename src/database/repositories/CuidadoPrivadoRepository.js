import { CuidadoPrivado } from '../../models/CuidadoPrivado';
import { BaseRepository } from './BaseRepository';

export class CuidadoPrivadoRepository extends BaseRepository {
  tabela = 'cuidados_privados';

  deLinha(linha) {
    return CuidadoPrivado.fromRow(linha);
  }

  buscarPorRegistro(registroId) {
    const linha = this.db.getFirstSync(
      'SELECT * FROM cuidados_privados WHERE registro_id = ? AND excluido_em IS NULL',
      [registroId],
    );
    return linha ? CuidadoPrivado.fromRow(linha) : null;
  }
}
