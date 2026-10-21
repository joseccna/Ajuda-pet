import { horariosDeTexto, horariosParaTexto, normalizarHorarios } from './regrasAlimentacao';
import { BaseModel } from './BaseModel';

/**
 * Plano alimentar de um pet: ração, quantidade por refeição e horários.
 * Trocar o plano encerra a vigência do anterior (fim) e cria um novo, guardando o histórico.
 * fim = null significa "em vigor".
 */
export class PlanoAlimentar extends BaseModel {
  constructor(dados = {}, base) {
    super(base);
    this.petId = dados.petId ?? '';
    this.tipoRacao = dados.tipoRacao ?? '';
    this.quantidadeG = dados.quantidadeG ?? 0;
    this.horarios = normalizarHorarios(dados.horarios ?? []);
    this.inicio = dados.inicio ?? '';
    this.fim = dados.fim ?? null;
    this.observacoes = dados.observacoes ?? '';
    this.sacoG = dados.sacoG ?? null;
    this.sacoAbertoEm = dados.sacoAbertoEm ?? null;
    this.lembretes = dados.lembretes ?? true;
  }

  validar() {
    const erros = {};
    if (this.tipoRacao.trim() === '') erros.tipoRacao = 'Informe o tipo de ração.';
    if (!Number.isInteger(this.quantidadeG) || this.quantidadeG < 1 || this.quantidadeG > 5000) {
      erros.quantidadeG = 'Informe a quantidade por refeição em gramas (1 a 5000).';
    }
    if (this.horarios.length === 0) erros.horarios = 'Adicione pelo menos um horário.';
    if (this.sacoG !== null && (!Number.isInteger(this.sacoG) || this.sacoG < 1)) {
      erros.sacoG = 'Informe o tamanho do saco em quilos.';
    }
    return erros;
  }

  toRow() {
    return {
      pet_id: this.petId,
      tipo_racao: this.tipoRacao.trim(),
      quantidade_g: this.quantidadeG,
      horarios: horariosParaTexto(this.horarios),
      inicio: this.inicio,
      fim: this.fim,
      observacoes: this.observacoes.trim(),
      saco_g: this.sacoG,
      saco_aberto_em: this.sacoAbertoEm,
      lembretes: this.lembretes ? 1 : 0,
    };
  }

  static fromRow(r) {
    return new PlanoAlimentar(
      {
        petId: String(r.pet_id),
        tipoRacao: String(r.tipo_racao),
        quantidadeG: Number(r.quantidade_g),
        horarios: horariosDeTexto(String(r.horarios ?? '')),
        inicio: String(r.inicio),
        fim: r.fim ?? null,
        observacoes: String(r.observacoes ?? ''),
        sacoG: r.saco_g ?? null,
        sacoAbertoEm: r.saco_aberto_em ?? null,
        lembretes: r.lembretes === 1,
      },
      BaseModel.baseDeLinha(r),
    );
  }
}
