import { descreverIdade } from '../utils/datas';
import { BaseModel } from './BaseModel';

/**
 * Valores aceitos:
 * @typedef {'cachorro' | 'gato' | 'outro'} Especie
 * @typedef {'macho' | 'femea' | 'desconhecido'} Sexo
 * @typedef {'sim' | 'nao' | 'desconhecido'} Castracao
 * @typedef {'proprio' | 'compartilhado' | 'ficha'} OrigemPet
 */

const PADRAO = {
  nome: '',
  especie: 'cachorro',
  especieOutra: '',
  raca: '',
  sexo: 'desconhecido',
  nascimento: null,
  nascimentoAproximado: false,
  fotoUri: null,
  cor: '',
  microchip: '',
  castrado: 'desconhecido',
  observacoes: '',
  falecido: false,
  dataFalecimento: null,
  origem: 'proprio',
  donoDispositivoId: null,
};
export class Pet extends BaseModel {
  constructor(dados = {}, base) {
    super(base);
    const d = { ...PADRAO, ...dados };
    this.nome = d.nome;
    this.especie = d.especie;
    this.especieOutra = d.especieOutra;
    this.raca = d.raca;
    this.sexo = d.sexo;
    this.nascimento = d.nascimento;
    this.nascimentoAproximado = d.nascimentoAproximado;
    this.fotoUri = d.fotoUri;
    this.cor = d.cor;
    this.microchip = d.microchip;
    this.castrado = d.castrado;
    this.observacoes = d.observacoes;
    this.falecido = d.falecido;
    this.dataFalecimento = d.dataFalecimento;
    this.origem = d.origem;
    this.donoDispositivoId = d.donoDispositivoId;
  }
  /** "Cachorra", "Gato", ou o texto livre quando a espécie é "outro". */
  get rotuloEspecie() {
    const femea = this.sexo === 'femea';
    if (this.especie === 'cachorro') return femea ? 'Cachorra' : 'Cachorro';
    if (this.especie === 'gato') return femea ? 'Gata' : 'Gato';
    return this.especieOutra.trim() || 'Pet';
  }
  /** "da Luna", "do Thor" ou "de Pipoca", para frases como "V8 da Luna". */
  get deNome() {
    const prep = this.sexo === 'femea' ? 'da' : this.sexo === 'macho' ? 'do' : 'de';
    return `${prep} ${this.nome.trim()}`;
  }

  /** "4 anos", "Cerca de 2 anos", "Idade desconhecida". */
  get idade() {
    return descreverIdade(this.nascimento, this.nascimentoAproximado);
  }
  /** Linha curta para cartões: "Cachorra • 4 anos". */
  get resumo() {
    return `${this.rotuloEspecie} • ${this.idade}`;
  }
  /** Só o nome e a espécie são obrigatórios. */
  validar() {
    const erros = {};
    if (this.nome.trim() === '') erros.nome = 'Dê um nome para o pet.';
    else if (this.nome.trim().length > 60) erros.nome = 'Use até 60 letras.';
    if (this.especie === 'outro' && this.especieOutra.trim() === '') {
      erros.especie = 'Diga qual é a espécie.';
    }
    return erros;
  }
  marcarComoFalecido(dataISO) {
    this.falecido = true;
    this.dataFalecimento = dataISO;
  }
  /** Desfaz a despedida: o pet volta à lista, com os lembretes. */
  desfazerFalecimento() {
    this.falecido = false;
    this.dataFalecimento = null;
  }

  toRow() {
    return {
      nome: this.nome.trim(),
      especie: this.especie,
      especie_outra: this.especieOutra.trim(),
      raca: this.raca.trim(),
      sexo: this.sexo,
      nascimento: this.nascimento,
      nascimento_aproximado: this.nascimentoAproximado ? 1 : 0,
      foto_uri: this.fotoUri,
      cor: this.cor.trim(),
      microchip: this.microchip.trim(),
      castrado: this.castrado,
      observacoes: this.observacoes.trim(),
      falecido: this.falecido ? 1 : 0,
      data_falecimento: this.dataFalecimento,
      origem: this.origem,
      dono_dispositivo_id: this.donoDispositivoId,
    };
  }
  static fromRow(r) {
    return new Pet(
      {
        nome: String(r.nome),
        especie: r.especie,
        especieOutra: String(r.especie_outra ?? ''),
        raca: String(r.raca ?? ''),
        sexo: r.sexo,
        nascimento: r.nascimento ?? null,
        nascimentoAproximado: r.nascimento_aproximado === 1,
        fotoUri: r.foto_uri ?? null,
        cor: String(r.cor ?? ''),
        microchip: String(r.microchip ?? ''),
        castrado: r.castrado,
        observacoes: String(r.observacoes ?? ''),
        falecido: r.falecido === 1,
        dataFalecimento: r.data_falecimento ?? null,
        origem: r.origem,
        donoDispositivoId: r.dono_dispositivo_id ?? null,
      },
      BaseModel.baseDeLinha(r),
    );
  }
}
