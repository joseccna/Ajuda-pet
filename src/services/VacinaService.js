import { PetRepository } from '../database/repositories/PetRepository';
import { TipoVacinaRepository } from '../database/repositories/TipoVacinaRepository';
import { DoseVacinaRepository } from '../database/repositories/DoseVacinaRepository';
import { Database } from '../database/Database';
import { DoseVacina } from '../models/DoseVacina';
import { criarLembrete } from '../models/Lembrete';
import { criarEvento, estadoPorData } from '../models/regrasAgenda';
import { TipoVacina } from '../models/TipoVacina';
import {
  calcularSituacao,
  compararPorUrgencia,
  proximaDose,
  rotuloSugerido,
  textoSituacao,
} from '../models/regrasVacina';
import { paraISO } from '../utils/datas';

export class ErroValidacaoVacina extends Error {
  constructor(erros) {
    super('Dados da vacina inválidos');
    this.name = 'ErroValidacaoVacina';
    this.erros = erros;
  }
}

/** Regras da carteirinha de vacinas e dos lembretes que ela gera. */
export class VacinaService {
  constructor(
    tipos = new TipoVacinaRepository(),
    doses = new DoseVacinaRepository(),
    pets = new PetRepository(),
  ) {
    this.tipos = tipos;
    this.doses = doses;
    this.pets = pets;
  }

  /** Cartões do pet, do mais urgente para o menos urgente. */
  carteirinha(petId, hoje = new Date()) {
    const hojeISO = paraISO(hoje);
    const doses = this.doses.listarPorPet(petId);
    return this.tipos
      .listarPorPet(petId)
      .map((tipo) => {
        const dosesDoTipo = doses.filter((d) => d.tipoId === tipo.id);
        const proxima = proximaDose(tipo, dosesDoTipo);
        const situacao = calcularSituacao(proxima, hojeISO);
        return { tipo, doses: dosesDoTipo, proxima, situacao, texto: textoSituacao(situacao) };
      })
      .sort(compararPorUrgencia);
  }

  buscarTipo(id) {
    return this.tipos.buscarPorId(id);
  }

  buscarDose(id) {
    return this.doses.buscarPorId(id);
  }

  tiposDoPet(petId) {
    return this.tipos.listarPorPet(petId);
  }

  /** Rótulo sugerido para a próxima dose de um tipo (1ª, 2ª, 3ª, Reforço). */
  rotuloParaProximaDose(tipoId) {
    const doses = this.doses.listarPorPet(this.tipos.buscarPorId(tipoId)?.petId ?? '');
    return rotuloSugerido(doses.filter((d) => d.tipoId === tipoId));
  }

  nomeDeTipoJaExiste(petId, nome) {
    return this.tipos.existeNome(petId, nome);
  }

  /** Cria o cartão e, se informada, a primeira dose, tudo em uma transação. */
  criarTipo({ petId, nome, intervaloDias, observacao = '', dataUltimaDose = null }) {
    const tipo = new TipoVacina({ petId, nome, intervaloDias, observacao });
    const erros = tipo.validar();
    if (Object.keys(erros).length > 0) throw new ErroValidacaoVacina(erros);

    Database.get().withTransactionSync(() => {
      this.tipos.salvar(tipo);
      if (dataUltimaDose) {
        this.doses.salvar(
          new DoseVacina({ tipoId: tipo.id, rotulo: '1ª dose', dataAplicacao: dataUltimaDose }),
        );
      }
    });
    return tipo;
  }

  excluirTipo(tipoId) {
    Database.get().withTransactionSync(() => {
      this.doses.excluirPorTipo(tipoId);
      this.tipos.excluir(tipoId);
    });
  }

  salvarDose(dose) {
    const erros = dose.validar();
    if (Object.keys(erros).length > 0) throw new ErroValidacaoVacina(erros);
    return this.doses.salvar(dose);
  }

  excluirDose(doseId) {
    this.doses.excluir(doseId);
  }

  /** Próximas doses de todos os pets ativos que caem no intervalo (contrato de evento da agenda). */
  eventos(inicioISO, fimISO, hoje = new Date()) {
    const hojeISO = paraISO(hoje);
    const resultado = [];
    for (const pet of this.pets.listarAtivos()) {
      for (const item of this.carteirinha(pet.id, hoje)) {
        if (!item.proxima || item.proxima < inicioISO || item.proxima > fimISO) continue;
        resultado.push(
          criarEvento({
            chave: `vacina-${item.tipo.id}`,
            petId: pet.id,
            petNome: pet.nome,
            titulo: `${item.tipo.nome} ${pet.deNome}`,
            texto: item.texto,
            data: item.proxima,
            estado: estadoPorData(item.proxima, hojeISO),
            icone: 'shield-checkmark-outline',
            rota: { pathname: '/pet/[id]', params: { id: pet.id, aba: 'saude' } },
          }),
        );
      }
    }
    return resultado;
  }

  /** Lembretes de todos os pets ativos (contrato Lembrete). */
  lembretes(hoje = new Date()) {
    const resultado = [];
    for (const pet of this.pets.listarAtivos()) {
      for (const item of this.carteirinha(pet.id, hoje)) {
        const { estado, dias } = item.situacao;
        if (estado !== 'atrasada' && estado !== 'em-breve') continue;
        resultado.push(
          criarLembrete({
            chave: `vacina-${item.tipo.id}`,
            petId: pet.id,
            petNome: pet.nome,
            titulo: `${item.tipo.nome} ${pet.deNome}`,
            texto: item.texto,
            dias,
            data: item.proxima,
            icone: 'shield-checkmark-outline',
            rota: { pathname: '/pet/[id]', params: { id: pet.id, aba: 'saude' } },
          }),
        );
      }
    }
    return resultado;
  }
}

export const vacinaService = new VacinaService();
