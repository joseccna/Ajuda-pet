import { lerEmail, lerTelefone } from './regrasTutor';
import { BaseModel } from './BaseModel';

/**
 * Perfil do tutor deste aparelho, com os contatos de confiança (veterinário, pet shop e contato de emergência).
 * O contato de emergência é só informativo: o app não envia mensagens a ninguém.
 */
export class Tutor extends BaseModel {
  constructor(dados = {}, base) {
    super(base);
    this.nome = dados.nome ?? '';
    this.apelido = dados.apelido ?? '';
    this.telefone = dados.telefone ?? '';
    this.email = dados.email ?? '';
    this.vetNome = dados.vetNome ?? '';
    this.vetClinica = dados.vetClinica ?? '';
    this.vetTelefone = dados.vetTelefone ?? '';
    this.petshopNome = dados.petshopNome ?? '';
    this.petshopTelefone = dados.petshopTelefone ?? '';
    this.emergenciaNome = dados.emergenciaNome ?? '';
    this.emergenciaRelacao = dados.emergenciaRelacao ?? '';
    this.emergenciaTelefone = dados.emergenciaTelefone ?? '';
  }

  /** Só o nome é essencial; telefones e e-mail, se informados, precisam estar corretos. */
  validar() {
    const erros = {};
    if (this.nome.trim() === '') erros.nome = 'Informe seu nome.';
    else if (this.nome.trim().length > 80) erros.nome = 'Use até 80 letras.';
    if (this.apelido.trim().length > 30) erros.apelido = 'Use até 30 letras.';
    for (const [campo, valor] of [
      ['telefone', this.telefone],
      ['vetTelefone', this.vetTelefone],
      ['petshopTelefone', this.petshopTelefone],
      ['emergenciaTelefone', this.emergenciaTelefone],
    ]) {
      const r = lerTelefone(valor);
      if ('erro' in r) erros[campo] = r.erro;
    }
    const email = lerEmail(this.email);
    if ('erro' in email) erros.email = email.erro;
    return erros;
  }

  /** O perfil já tem o essencial preenchido? */
  get preenchido() {
    return this.nome.trim() !== '';
  }

  toRow() {
    return {
      nome: this.nome.trim(),
      apelido: this.apelido.trim(),
      telefone: this.telefone,
      email: this.email.trim(),
      vet_nome: this.vetNome.trim(),
      vet_clinica: this.vetClinica.trim(),
      vet_telefone: this.vetTelefone,
      petshop_nome: this.petshopNome.trim(),
      petshop_telefone: this.petshopTelefone,
      emergencia_nome: this.emergenciaNome.trim(),
      emergencia_relacao: this.emergenciaRelacao.trim(),
      emergencia_telefone: this.emergenciaTelefone,
    };
  }

  static fromRow(r) {
    return new Tutor(
      {
        nome: String(r.nome ?? ''),
        apelido: String(r.apelido ?? ''),
        telefone: String(r.telefone ?? ''),
        email: String(r.email ?? ''),
        vetNome: String(r.vet_nome ?? ''),
        vetClinica: String(r.vet_clinica ?? ''),
        vetTelefone: String(r.vet_telefone ?? ''),
        petshopNome: String(r.petshop_nome ?? ''),
        petshopTelefone: String(r.petshop_telefone ?? ''),
        emergenciaNome: String(r.emergencia_nome ?? ''),
        emergenciaRelacao: String(r.emergencia_relacao ?? ''),
        emergenciaTelefone: String(r.emergencia_telefone ?? ''),
      },
      BaseModel.baseDeLinha(r),
    );
  }
}
