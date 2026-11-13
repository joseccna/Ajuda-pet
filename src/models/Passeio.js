import { BaseModel } from './BaseModel';

/** Duração máxima aceita para um passeio: 24 horas. */
const MAX_SEGUNDOS = 24 * 60 * 60;

/**
 * Um passeio. Enquanto emAndamento é verdadeiro, o tempo é calculado a partir de inicio
 * (descontando as pausas), então o cronômetro não depende de o app ficar aberto.
 * Guarda só a distância, nunca o trajeto.
 *
 * A duração é guardada em segundos (duracaoS). duracaoMin é derivado, arredondado, e pode
 * ser atribuído (formulário manual, em minutos): vira segundos.
 */
export class Passeio extends BaseModel {
  constructor(dados = {}, base) {
    super(base);
    this.petId = dados.petId ?? '';
    this.inicio = dados.inicio ?? new Date().toISOString();
    this.fim = dados.fim ?? null;
    this.duracaoS =
      dados.duracaoS ?? (dados.duracaoMin !== undefined && dados.duracaoMin !== null ? dados.duracaoMin * 60 : null);
    this.distanciaKm = dados.distanciaKm ?? null;
    this.observacao = dados.observacao ?? '';
    this.emAndamento = dados.emAndamento ?? false;
    this.pausaTotalS = dados.pausaTotalS ?? 0;
    this.pausadoDesde = dados.pausadoDesde ?? null;
  }

  get duracaoMin() {
    return this.duracaoS === null || this.duracaoS === undefined ? null : Math.round(this.duracaoS / 60);
  }

  set duracaoMin(minutos) {
    this.duracaoS = minutos === null || minutos === undefined ? null : minutos * 60;
  }

  validar() {
    const erros = {};
    if (!this.emAndamento) {
      if (!Number.isInteger(this.duracaoS) || this.duracaoS < 1 || this.duracaoS > MAX_SEGUNDOS) {
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
      duracao_s: this.duracaoS,
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
        // Passeios de antes da migração 11 (ou de backups antigos) só têm minutos.
        duracaoS: r.duracao_s ?? (r.duracao_min !== null && r.duracao_min !== undefined ? r.duracao_min * 60 : null),
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
