import { ConsultaPrivada } from '../../models/ConsultaPrivada';
import { BaseRepository } from './BaseRepository';

export class ConsultaPrivadaRepository extends BaseRepository {
  tabela = 'consultas_privadas';

  deLinha(linha) {
    return ConsultaPrivada.fromRow(linha);
  }

  buscarPorConsulta(consultaId) {
    const linha = this.db.getFirstSync(
      'SELECT * FROM consultas_privadas WHERE consulta_id = ? AND excluido_em IS NULL',
      [consultaId],
    );
    return linha ? ConsultaPrivada.fromRow(linha) : null;
  }

  /** Partes privadas das consultas de um pet, indexadas pelo id da consulta. */
  mapaPorPet(petId) {
    const mapa = {};
    const linhas = this.db.getAllSync(
      `SELECT x.* FROM consultas_privadas x JOIN consultas c ON c.id = x.consulta_id
       WHERE c.pet_id = ? AND x.excluido_em IS NULL AND c.excluido_em IS NULL`,
      [petId],
    );
    for (const l of linhas) mapa[l.consulta_id] = ConsultaPrivada.fromRow(l);
    return mapa;
  }
}
