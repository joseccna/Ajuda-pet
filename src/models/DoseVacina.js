import { BaseModel } from './BaseModel';

/**
 * Uma dose aplicada, dentro de um cartão (TipoVacina).
 * proximaDoseManual: quando preenchida, vale no lugar da data calculada pelo intervalo.
 */
export class DoseVacina extends BaseModel {
  constructor(dados = {}, base) {
    super(base);
    this.tipoId = dados.tipoId ?? '';
    this.rotulo = dados.rotulo ?? '';
    this.dataAplicacao = dados.dataAplicacao ?? '';
    this.proximaDoseManual = dados.proximaDoseManual ?? null;
    this.lote = dados.lote ?? '';
    this.veterinario = dados.veterinario ?? '';
    this.clinica = dados.clinica ?? '';
    this.observacao = dados.observacao ?? '';
  }

  validar() {
    const erros = {};
    if (!this.dataAplicacao) erros.dataAplicacao = 'Informe a data da aplicação.';
    if (this.rotulo.trim() === '') erros.rotulo = 'Dê um nome para a dose, como 1ª dose ou Reforço.';
    else if (this.rotulo.trim().length > 40) erros.rotulo = 'Use até 40 letras.';
    if (this.proximaDoseManual && this.dataAplicacao && this.proximaDoseManual <= this.dataAplicacao) {
      erros.proximaDoseManual = 'A próxima dose precisa ser depois da aplicação.';
    }
    return erros;
  }

  toRow() {
    return {
      tipo_id: this.tipoId,
      rotulo: this.rotulo.trim(),
      data_aplicacao: this.dataAplicacao,
      proxima_dose_manual: this.proximaDoseManual,
      lote: this.lote.trim(),
      veterinario: this.veterinario.trim(),
      clinica: this.clinica.trim(),
      observacao: this.observacao.trim(),
    };
  }

  static fromRow(r) {
    return new DoseVacina(
      {
        tipoId: String(r.tipo_id),
        rotulo: String(r.rotulo),
        dataAplicacao: String(r.data_aplicacao),
        proximaDoseManual: r.proxima_dose_manual ?? null,
        lote: String(r.lote ?? ''),
        veterinario: String(r.veterinario ?? ''),
        clinica: String(r.clinica ?? ''),
        observacao: String(r.observacao ?? ''),
      },
      BaseModel.baseDeLinha(r),
    );
  }
}
