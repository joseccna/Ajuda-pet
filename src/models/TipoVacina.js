import { BaseModel } from './BaseModel';

/**
 * Um "cartão" da carteirinha: um tipo de vacina de um pet (V10, antirrábica...).
 * As doses aplicadas ficam dentro dele (ver DoseVacina).
 * intervaloDias: dias entre os reforços. null significa "sem reforço previsto".
 */
export class TipoVacina extends BaseModel {
  constructor(dados = {}, base) {
    super(base);
    this.petId = dados.petId ?? '';
    this.nome = dados.nome ?? '';
    this.intervaloDias = dados.intervaloDias ?? null;
    this.observacao = dados.observacao ?? '';
  }

  validar() {
    const erros = {};
    if (this.nome.trim() === '') erros.nome = 'Informe o nome da vacina.';
    else if (this.nome.trim().length > 60) erros.nome = 'Use até 60 letras.';
    if (this.intervaloDias !== null) {
      if (!Number.isInteger(this.intervaloDias) || this.intervaloDias < 1 || this.intervaloDias > 3650) {
        erros.intervaloDias = 'Informe de 1 a 3650 dias.';
      }
    }
    return erros;
  }

  toRow() {
    return {
      pet_id: this.petId,
      nome: this.nome.trim(),
      intervalo_dias: this.intervaloDias,
      observacao: this.observacao.trim(),
    };
  }

  static fromRow(r) {
    return new TipoVacina(
      {
        petId: String(r.pet_id),
        nome: String(r.nome),
        intervaloDias: r.intervalo_dias ?? null,
        observacao: String(r.observacao ?? ''),
      },
      BaseModel.baseDeLinha(r),
    );
  }
}
