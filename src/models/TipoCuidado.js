import { ICONE_PADRAO } from './regrasCuidado';
import { BaseModel } from './BaseModel';

/** Um tipo de cuidado periódico de um pet (banho, tosa, antipulgas...). intervaloDias null = sem periodicidade. */
export class TipoCuidado extends BaseModel {
  constructor(dados = {}, base) {
    super(base);
    this.petId = dados.petId ?? '';
    this.nome = dados.nome ?? '';
    this.icone = dados.icone ?? ICONE_PADRAO;
    this.intervaloDias = dados.intervaloDias ?? null;
  }

  validar() {
    const erros = {};
    if (this.nome.trim() === '') erros.nome = 'Informe o nome do cuidado.';
    else if (this.nome.trim().length > 40) erros.nome = 'Use até 40 letras.';
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
      icone: this.icone,
      intervalo_dias: this.intervaloDias,
    };
  }

  static fromRow(r) {
    return new TipoCuidado(
      {
        petId: String(r.pet_id),
        nome: String(r.nome),
        icone: String(r.icone ?? ICONE_PADRAO),
        intervaloDias: r.intervalo_dias ?? null,
      },
      BaseModel.baseDeLinha(r),
    );
  }
}
