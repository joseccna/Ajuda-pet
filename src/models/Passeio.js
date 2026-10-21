import { BaseModel } from './BaseModel';

/**
 * Um passeio. Enquanto emAndamento é verdadeiro, o tempo é calculado a partir de inicio
 * (descontando as pausas), então o cronômetro não depende de o app ficar aberto.
 * Guarda só a distância, nunca o trajeto.
 */
export class Passeio extends BaseModel {
  constructor(dados = {}, base) {
    super(base);
    this.petId = dados.petId ?? '';
    this.inicio = dados.inicio ?? new Date().toISOString();
    this.fim = dados.fim ?? null;
    this.duracaoMin = dados.duracaoMin ?? null;
    this.distanciaKm = dados.distanciaKm ?? null;
    this.observacao = dados.observacao ?? '';
    this.emAndamento = dados.emAndamento ?? false;
    this.pausaTotalS = dados.pausaTotalS ?? 0;
    this.pausadoDesde = dados.pausadoDesde ?? null;
  }

  validar() {
    const erros = {};
    if (!this.emAndamento) {
      if (!Number.isInteger(this.duracaoMin) || this.duracaoMin < 1 || this.duracaoMin > 1440) {
        erros.duracaoMin = 'Informe a duração em minutos (1 a 1440).';
      }
    }
    if (this.distanciaKm !== null && (!(this.distanciaKm >= 0) || this.distanciaKm > 500)) {
      erros.distanciaKm = 'Informe a distância em quilômetros.';
    }
    return erros;
  }

  toRow() {
    return {
      pet_id: this.petId,
      inicio: this.inicio,
      fim: this.fim,
      duracao_min: this.duracaoMin,
      distancia_km: this.distanciaKm,
      observacao: this.observacao.trim(),
      em_andamento: this.emAndamento ? 1 : 0,
      pausa_total_s: this.pausaTotalS,
      pausado_desde: this.pausadoDesde,
    };
  }

  static fromRow(r) {
    return new Passeio(
      {
        petId: String(r.pet_id),
        inicio: String(r.inicio),
        fim: r.fim ?? null,
        duracaoMin: r.duracao_min ?? null,
        distanciaKm: r.distancia_km ?? null,
        observacao: String(r.observacao ?? ''),
        emAndamento: r.em_andamento === 1,
        pausaTotalS: Number(r.pausa_total_s ?? 0),
        pausadoDesde: r.pausado_desde ?? null,
      },
      BaseModel.baseDeLinha(r),
    );
  }
}
