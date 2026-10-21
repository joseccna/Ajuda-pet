import { BaseModel } from './BaseModel';

/** Um cuidado feito (data até hoje) ou agendado (data futura). */
export class RegistroCuidado extends BaseModel {
  constructor(dados = {}, base) {
    super(base);
    this.tipoId = dados.tipoId ?? '';
    this.data = dados.data ?? '';
    this.local = dados.local ?? '';
    this.observacao = dados.observacao ?? '';
  }

  validar() {
    const erros = {};
    if (!this.data) erros.data = 'Informe a data.';
    return erros;
  }

  toRow() {
    return {
      tipo_id: this.tipoId,
      data: this.data,
      local: this.local.trim(),
      observacao: this.observacao.trim(),
    };
  }

  static fromRow(r) {
    return new RegistroCuidado(
      {
        tipoId: String(r.tipo_id),
        data: String(r.data),
        local: String(r.local ?? ''),
        observacao: String(r.observacao ?? ''),
      },
      BaseModel.baseDeLinha(r),
    );
  }
}
