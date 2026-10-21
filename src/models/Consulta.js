import { BaseModel } from './BaseModel';

/**
 * Uma consulta veterinária, passada ou agendada.
 * Valor e anotações pessoais NÃO ficam aqui: vão em ConsultaPrivada.
 */
export class Consulta extends BaseModel {
  constructor(dados = {}, base) {
    super(base);
    this.petId = dados.petId ?? '';
    this.data = dados.data ?? '';
    this.hora = dados.hora ?? '';
    this.motivo = dados.motivo ?? '';
    this.veterinario = dados.veterinario ?? '';
    this.clinica = dados.clinica ?? '';
    this.diagnostico = dados.diagnostico ?? '';
    this.prescricao = dados.prescricao ?? '';
    this.retornoEm = dados.retornoEm ?? null;
  }

  validar() {
    const erros = {};
    if (!this.data) erros.data = 'Informe a data da consulta.';
    if (this.motivo.trim() === '') erros.motivo = 'Informe o motivo da consulta.';
    else if (this.motivo.trim().length > 80) erros.motivo = 'Use até 80 letras.';
    if (this.retornoEm && this.data && this.retornoEm <= this.data) {
      erros.retornoEm = 'O retorno precisa ser depois da consulta.';
    }
    return erros;
  }

  toRow() {
    return {
      pet_id: this.petId,
      data: this.data,
      hora: this.hora,
      motivo: this.motivo.trim(),
      veterinario: this.veterinario.trim(),
      clinica: this.clinica.trim(),
      diagnostico: this.diagnostico.trim(),
      prescricao: this.prescricao.trim(),
      retorno_em: this.retornoEm,
    };
  }

  static fromRow(r) {
    return new Consulta(
      {
        petId: String(r.pet_id),
        data: String(r.data),
        hora: String(r.hora ?? ''),
        motivo: String(r.motivo),
        veterinario: String(r.veterinario ?? ''),
        clinica: String(r.clinica ?? ''),
        diagnostico: String(r.diagnostico ?? ''),
        prescricao: String(r.prescricao ?? ''),
        retornoEm: r.retorno_em ?? null,
      },
      BaseModel.baseDeLinha(r),
    );
  }
}
