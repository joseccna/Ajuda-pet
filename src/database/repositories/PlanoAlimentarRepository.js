import { PlanoAlimentar } from '../../models/PlanoAlimentar';
import { BaseRepository } from './BaseRepository';

export class PlanoAlimentarRepository extends BaseRepository {
  tabela = 'planos_alimentares';

  deLinha(linha) {
    return PlanoAlimentar.fromRow(linha);
  }

  /** Plano em vigor (sem data de fim), o mais recente se houver mais de um. */
  vigente(petId) {
    const linha = this.db.getFirstSync(
      `SELECT * FROM planos_alimentares
       WHERE pet_id = ? AND fim IS NULL AND excluido_em IS NULL
       ORDER BY inicio DESC, criado_em DESC LIMIT 1`,
      [petId],
    );
    return linha ? PlanoAlimentar.fromRow(linha) : null;
  }

  /** Todos os planos do pet, do mais recente para o mais antigo. */
  historico(petId) {
    return this.db
      .getAllSync(
        `SELECT * FROM planos_alimentares WHERE pet_id = ? AND excluido_em IS NULL
         ORDER BY inicio DESC, criado_em DESC`,
        [petId],
      )
      .map((l) => PlanoAlimentar.fromRow(l));
  }

  /** Planos em vigor de pets ativos, para os lembretes de refeição. */
  vigentesDePetsAtivos() {
    return this.db
      .getAllSync(
        `SELECT a.* FROM planos_alimentares a JOIN pets p ON p.id = a.pet_id
         WHERE a.fim IS NULL AND a.excluido_em IS NULL AND p.excluido_em IS NULL AND p.falecido = 0`,
      )
      .map((l) => PlanoAlimentar.fromRow(l));
  }
}
