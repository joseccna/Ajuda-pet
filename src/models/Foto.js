import { BaseModel } from './BaseModel';

/** Uma foto da galeria do pet. thumbUri é a miniatura (pode faltar em fotos antigas). */
export class Foto extends BaseModel {
  constructor(dados = {}, base) {
    super(base);
    this.petId = dados.petId ?? '';
    this.uri = dados.uri ?? '';
    this.thumbUri = dados.thumbUri ?? null;
    this.legenda = dados.legenda ?? '';
    this.data = dados.data ?? '';
  }

  /** Miniatura para a grade; sem ela, usa a foto inteira. */
  get miniatura() {
    return this.thumbUri ?? this.uri;
  }

  toRow() {
    return {
      pet_id: this.petId,
      uri: this.uri,
      thumb_uri: this.thumbUri,
      legenda: this.legenda.trim(),
      data: this.data,
    };
  }

  static fromRow(r) {
    return new Foto(
      {
        petId: String(r.pet_id),
        uri: String(r.uri),
        thumbUri: r.thumb_uri ?? null,
        legenda: String(r.legenda ?? ''),
        data: String(r.data),
      },
      BaseModel.baseDeLinha(r),
    );
  }
}
