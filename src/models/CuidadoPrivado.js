import { BaseModel } from './BaseModel';

/** O valor pago em um cuidado (centavos). Privado: nunca sai deste aparelho. */
export class CuidadoPrivado extends BaseModel {
  constructor(dados = {}, base) {
    super(base);
    this.registroId = dados.registroId ?? '';
    this.valorCentavos = dados.valorCentavos ?? null;
  }

  toRow() {
    return { registro_id: this.registroId, valor_centavos: this.valorCentavos };
  }

  static fromRow(r) {
    return new CuidadoPrivado(
      { registroId: String(r.registro_id), valorCentavos: r.valor_centavos ?? null },
      BaseModel.baseDeLinha(r),
    );
  }
}
