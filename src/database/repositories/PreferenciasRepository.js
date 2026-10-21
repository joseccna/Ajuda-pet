import { Preferencias } from '../../models/Preferencias';
import { BaseRepository } from './BaseRepository';

export class PreferenciasRepository extends BaseRepository {
  tabela = 'configuracao_app';

  deLinha(linha) {
    return Preferencias.fromRow(linha);
  }

  /** As preferências deste aparelho (há uma linha só). */
  atual() {
    const linha = this.db.getFirstSync(
      'SELECT * FROM configuracao_app WHERE excluido_em IS NULL ORDER BY criado_em LIMIT 1',
    );
    return linha ? Preferencias.fromRow(linha) : null;
  }
}
