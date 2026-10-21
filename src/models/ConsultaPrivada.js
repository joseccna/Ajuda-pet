import { BaseModel } from './BaseModel';

/**
 * A parte privada de uma consulta: valor (em centavos) e anotações pessoais.
 * Fica em tabela separada para que nunca entre em pacotes de compartilhamento ou na ficha do pet.
 */
export class ConsultaPrivada extends BaseModel {
  constructor(dados = {}, base) {
    super(base);
    this.consultaId = dados.consultaId ?? '';
    this.valorCentavos = dados.valorCentavos ?? null;
    this.anotacoes = dados.anotacoes ?? '';
  }

  get vazia() {
    return this.valorCentavos === null && this.anotacoes.trim() === '';
  }

  toRow() {
    return {
      consulta_id: this.consultaId,
      valor_centavos: this.valorCentavos,
      anotacoes: this.anotacoes.trim(),
    };
  }

  static fromRow(r) {
    return new ConsultaPrivada(
      {
        consultaId: String(r.consulta_id),
        valorCentavos: r.valor_centavos ?? null,
        anotacoes: String(r.anotacoes ?? ''),
      },
      BaseModel.baseDeLinha(r),
    );
  }
}
