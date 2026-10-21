import { BaseModel } from './BaseModel';

/** Uma marcação durante o passeio: xixi, cocô, brincou ou cansado. */
export class MarcacaoPasseio extends BaseModel {
  constructor(dados = {}, base) {
    super(base);
    this.passeioId = dados.passeioId ?? '';
    this.tipo = dados.tipo ?? '';
    this.horario = dados.horario ?? new Date().toISOString();
  }

  toRow() {
    return { passeio_id: this.passeioId, tipo: this.tipo, horario: this.horario };
  }

  static fromRow(r) {
    return new MarcacaoPasseio(
      { passeioId: String(r.passeio_id), tipo: String(r.tipo), horario: String(r.horario) },
      BaseModel.baseDeLinha(r),
    );
  }
}
