import { MarcoMemorial } from '../../models/MarcoMemorial';
import { BaseRepository } from './BaseRepository';

export class MarcoMemorialRepository extends BaseRepository {
  tabela = 'marcos_memorial';

  deLinha(linha) {
    return MarcoMemorial.fromRow(linha);
  }

  listarPorPet(petId) {
    return this.db
      .getAllSync('SELECT * FROM marcos_memorial WHERE pet_id = ? AND excluido_em IS NULL', [petId])
      .map((l) => MarcoMemorial.fromRow(l));
  }
}
