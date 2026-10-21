import { BaseModel } from './BaseModel';

/** Uma refeição marcada como feita. Quem marcou fica em autorDispositivoId. */
export class RefeicaoRegistro extends BaseModel {
  constructor(dados = {}, base) {
    super(base);
    this.planoId = dados.planoId ?? '';
    this.petId = dados.petId ?? '';
    this.data = dados.data ?? '';
    this.horario = dados.horario ?? '';
  }

  toRow() {
    return { plano_id: this.planoId, pet_id: this.petId, data: this.data, horario: this.horario };
  }

  static fromRow(r) {
    return new RefeicaoRegistro(
      {
        planoId: String(r.plano_id),
        petId: String(r.pet_id),
        data: String(r.data),
        horario: String(r.horario),
      },
      BaseModel.baseDeLinha(r),
    );
  }
}
