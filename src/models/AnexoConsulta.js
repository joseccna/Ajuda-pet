import { BaseModel } from './BaseModel';

/** Foto de receita, exame ou laudo ligada a uma consulta. "privado" impede o envio a outros aparelhos. */
export class AnexoConsulta extends BaseModel {
  constructor(dados = {}, base) {
    super(base);
    this.consultaId = dados.consultaId ?? '';
    this.uri = dados.uri ?? '';
    this.tipo = dados.tipo ?? 'imagem';
    this.privado = dados.privado ?? false;
  }

  toRow() {
    return {
      consulta_id: this.consultaId,
      uri: this.uri,
      tipo: this.tipo,
      privado: this.privado ? 1 : 0,
    };
  }

  static fromRow(r) {
    return new AnexoConsulta(
      {
        consultaId: String(r.consulta_id),
        uri: String(r.uri),
        tipo: String(r.tipo ?? 'imagem'),
        privado: r.privado === 1,
      },
      BaseModel.baseDeLinha(r),
    );
  }
}
