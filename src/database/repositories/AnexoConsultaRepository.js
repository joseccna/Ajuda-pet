import { AnexoConsulta } from '../../models/AnexoConsulta';
import { BaseRepository } from './BaseRepository';

export class AnexoConsultaRepository extends BaseRepository {
  tabela = 'anexos_consulta';

  deLinha(linha) {
    return AnexoConsulta.fromRow(linha);
  }

  listarPorConsulta(consultaId) {
    return this.db
      .getAllSync(
        'SELECT * FROM anexos_consulta WHERE consulta_id = ? AND excluido_em IS NULL ORDER BY criado_em',
        [consultaId],
      )
      .map((l) => AnexoConsulta.fromRow(l));
  }

  /** Quantos anexos cada consulta do pet tem: { consultaId: n }. */
  contagemPorPet(petId) {
    const contagem = {};
    const linhas = this.db.getAllSync(
      `SELECT a.consulta_id AS id, COUNT(*) AS n FROM anexos_consulta a
       JOIN consultas c ON c.id = a.consulta_id
       WHERE c.pet_id = ? AND a.excluido_em IS NULL AND c.excluido_em IS NULL
       GROUP BY a.consulta_id`,
      [petId],
    );
    for (const l of linhas) contagem[l.id] = Number(l.n);
    return contagem;
  }
}
