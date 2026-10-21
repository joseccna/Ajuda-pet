import { RegistroPeso } from '../../models/RegistroPeso';
import { BaseRepository } from './BaseRepository';

export class RegistroPesoRepository extends BaseRepository {
  tabela = 'registros_peso';

  deLinha(linha) {
    return RegistroPeso.fromRow(linha);
  }

  /** Pesagens do pet, da mais recente para a mais antiga. */
  listarPorPet(petId) {
    return this.db
      .getAllSync(
        `SELECT * FROM registros_peso WHERE pet_id = ? AND excluido_em IS NULL
         ORDER BY data DESC, criado_em DESC`,
        [petId],
      )
      .map((l) => RegistroPeso.fromRow(l));
  }
}
