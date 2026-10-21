import { BaseModel } from './BaseModel';
import { atalhosDeTexto, atalhosParaTexto, normalizar } from './regrasPreferencias';

/** Preferências do tutor neste aparelho. Qualquer valor inválido volta ao padrão (ver normalizar). */
export class Preferencias extends BaseModel {
  constructor(dados = {}, base) {
    super(base);
    this.definir(dados);
  }

  /** Aplica valores (completando e corrigindo o que for inválido). */
  definir(dados) {
    const v = normalizar({ ...this.valores, ...dados });
    this.tema = v.tema;
    this.unidadePeso = v.unidadePeso;
    this.horarioPadrao = v.horarioPadrao;
    this.antecedenciaDias = v.antecedenciaDias;
    this.metaPasseioMin = v.metaPasseioMin;
    this.sugerirPesagem = v.sugerirPesagem;
    this.atalhos = v.atalhos;
    this.lembreteBackupDias = v.lembreteBackupDias;
    this.ultimoBackupEm = v.ultimoBackupEm;
  }

  /** Os valores como objeto simples, para usar nas telas e nos serviços. */
  get valores() {
    return {
      tema: this.tema,
      unidadePeso: this.unidadePeso,
      horarioPadrao: this.horarioPadrao,
      antecedenciaDias: this.antecedenciaDias,
      metaPasseioMin: this.metaPasseioMin,
      sugerirPesagem: this.sugerirPesagem,
      atalhos: this.atalhos,
      lembreteBackupDias: this.lembreteBackupDias,
      ultimoBackupEm: this.ultimoBackupEm,
    };
  }

  toRow() {
    return {
      tema: this.tema,
      unidade_peso: this.unidadePeso,
      horario_padrao: this.horarioPadrao,
      antecedencia_dias: this.antecedenciaDias,
      meta_passeio_min: this.metaPasseioMin,
      sugerir_pesagem: this.sugerirPesagem ? 1 : 0,
      atalhos_painel: atalhosParaTexto(this.atalhos),
      lembrete_backup_dias: this.lembreteBackupDias,
      ultimo_backup_em: this.ultimoBackupEm,
    };
  }

  static fromRow(r) {
    return new Preferencias(
      {
        tema: r.tema,
        unidadePeso: r.unidade_peso,
        horarioPadrao: r.horario_padrao,
        antecedenciaDias: r.antecedencia_dias,
        metaPasseioMin: r.meta_passeio_min,
        sugerirPesagem: r.sugerir_pesagem === 1,
        atalhos: atalhosDeTexto(String(r.atalhos_painel ?? '')),
        lembreteBackupDias: r.lembrete_backup_dias,
        ultimoBackupEm: r.ultimo_backup_em,
      },
      BaseModel.baseDeLinha(r),
    );
  }
}
