import { BaseModel } from './BaseModel';
import { REPETICOES, proximaData } from './regrasAgenda';

/**
 * Lembrete criado à mão na Agenda. "data" é a próxima vez em que ele vale.
 * Quando se repete, concluir avança a data; quando não se repete, guarda concluidoEm.
 */
export class LembreteAvulso extends BaseModel {
  constructor(dados = {}, base) {
    super(base);
    this.petId = dados.petId ?? '';
    this.tipo = dados.tipo ?? 'cuidado';
    this.titulo = dados.titulo ?? '';
    this.data = dados.data ?? '';
    this.hora = dados.hora ?? '';
    this.repetir = dados.repetir ?? 'nao';
    this.antecedenciaDias = dados.antecedenciaDias ?? 3;
    this.observacao = dados.observacao ?? '';
    this.concluidoEm = dados.concluidoEm ?? null;
  }

  validar() {
    const erros = {};
    if (!this.petId) erros.petId = 'Escolha o pet.';
    if (this.titulo.trim() === '') erros.titulo = 'Dê um título para o lembrete.';
    else if (this.titulo.trim().length > 60) erros.titulo = 'Use até 60 letras.';
    if (!this.data) erros.data = 'Informe a data.';
    if (!REPETICOES.some((r) => r.valor === this.repetir)) erros.repetir = 'Escolha como repetir.';
    if (!Number.isInteger(this.antecedenciaDias) || this.antecedenciaDias < 0 || this.antecedenciaDias > 30) {
      erros.antecedenciaDias = 'Escolha de 0 a 30 dias.';
    }
    return erros;
  }

  get repete() {
    return this.repetir !== 'nao';
  }

  /**
   * Marca como feito. Se repete, avança a data até a primeira ocorrência de hoje em diante
   * (se ficou muito tempo parado, não acumula um monte de atrasos). Se não repete, conclui.
   */
  concluir(hojeISO, agora = new Date()) {
    if (!this.repete) {
      this.concluidoEm = agora.toISOString();
      return;
    }
    let proxima = proximaData(this.data, this.repetir);
    for (let i = 0; i < 400 && proxima < hojeISO; i++) proxima = proximaData(proxima, this.repetir);
    this.data = proxima;
  }

  toRow() {
    return {
      pet_id: this.petId,
      tipo: this.tipo,
      titulo: this.titulo.trim(),
      data: this.data,
      hora: this.hora,
      repetir: this.repetir,
      antecedencia_dias: this.antecedenciaDias,
      observacao: this.observacao.trim(),
      concluido_em: this.concluidoEm,
    };
  }

  static fromRow(r) {
    return new LembreteAvulso(
      {
        petId: String(r.pet_id),
        tipo: String(r.tipo),
        titulo: String(r.titulo),
        data: String(r.data),
        hora: String(r.hora ?? ''),
        repetir: String(r.repetir ?? 'nao'),
        antecedenciaDias: Number(r.antecedencia_dias ?? 3),
        observacao: String(r.observacao ?? ''),
        concluidoEm: r.concluido_em ?? null,
      },
      BaseModel.baseDeLinha(r),
    );
  }
}
