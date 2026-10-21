import { BaseModel } from './BaseModel';

/** Uma pesagem. O peso é guardado em gramas (inteiro). */
export class RegistroPeso extends BaseModel {
  constructor(dados = {}, base) {
    super(base);
    this.petId = dados.petId ?? '';
    this.pesoG = dados.pesoG ?? 0;
    this.data = dados.data ?? '';
    this.observacao = dados.observacao ?? '';
  }

  validar() {
    const erros = {};
    if (!Number.isInteger(this.pesoG) || this.pesoG < 5) erros.peso = 'Informe o peso.';
    if (!this.data) erros.data = 'Informe a data da pesagem.';
    return erros;
  }

  toRow() {
    return {
      pet_id: this.petId,
      peso_g: this.pesoG,
      data: this.data,
      observacao: this.observacao.trim(),
    };
  }

  static fromRow(r) {
    return new RegistroPeso(
      {
        petId: String(r.pet_id),
        pesoG: Number(r.peso_g),
        data: String(r.data),
        observacao: String(r.observacao ?? ''),
      },
      BaseModel.baseDeLinha(r),
    );
  }
}
