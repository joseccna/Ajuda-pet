import { BaseModel } from './BaseModel';

/** A mensagem de homenagem a um pet. O autor fica em autorDispositivoId. */
export class Homenagem extends BaseModel {
  constructor(dados = {}, base) {
    super(base);
    this.petId = dados.petId ?? '';
    this.texto = dados.texto ?? '';
  }

  toRow() {
    return { pet_id: this.petId, texto: this.texto.trim() };
  }

  static fromRow(r) {
    return new Homenagem({ petId: String(r.pet_id), texto: String(r.texto) }, BaseModel.baseDeLinha(r));
  }
}
