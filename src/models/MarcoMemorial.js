import { BaseModel } from './BaseModel';

/** Um momento da linha do tempo do memorial (chegou em casa, primeiro passeio na praia...). A data é opcional. */
export class MarcoMemorial extends BaseModel {
  constructor(dados = {}, base) {
    super(base);
    this.petId = dados.petId ?? '';
    this.titulo = dados.titulo ?? '';
    this.data = dados.data ?? null;
  }

  validar() {
    const erros = {};
    if (this.titulo.trim() === '') erros.titulo = 'Conte o que aconteceu.';
    else if (this.titulo.trim().length > 80) erros.titulo = 'Use até 80 letras.';
    return erros;
  }

  toRow() {
    return { pet_id: this.petId, titulo: this.titulo.trim(), data: this.data };
  }

  static fromRow(r) {
    return new MarcoMemorial(
      { petId: String(r.pet_id), titulo: String(r.titulo), data: r.data ?? null },
      BaseModel.baseDeLinha(r),
    );
  }
}
