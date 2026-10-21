import { Database } from '../database/Database';
import { CuidadoPrivadoRepository } from '../database/repositories/CuidadoPrivadoRepository';
import { PetRepository } from '../database/repositories/PetRepository';
import { RegistroCuidadoRepository } from '../database/repositories/RegistroCuidadoRepository';
import { TipoCuidadoRepository } from '../database/repositories/TipoCuidadoRepository';
import { CuidadoPrivado } from '../models/CuidadoPrivado';
import { criarLembrete } from '../models/Lembrete';
import { criarEvento, estadoPorData } from '../models/regrasAgenda';
import { RegistroCuidado } from '../models/RegistroCuidado';
import { proximoCuidado, situacaoCuidado, textoCuidado, textoUltimo } from '../models/regrasCuidado';
import { compararPorUrgencia } from '../models/regrasVacina';
import { TipoCuidado } from '../models/TipoCuidado';
import { paraISO } from '../utils/datas';

export class ErroValidacaoCuidado extends Error {
  constructor(erros) {
    super('Dados do cuidado inválidos');
    this.name = 'ErroValidacaoCuidado';
    this.erros = erros;
  }
}

/** Regras de cuidados periódicos: banho, tosa, antipulgas, vermífugo e os que o tutor criar. */
export class CuidadoService {
  constructor(
    tipos = new TipoCuidadoRepository(),
    registros = new RegistroCuidadoRepository(),
    privados = new CuidadoPrivadoRepository(),
    pets = new PetRepository(),
  ) {
    this.tipos = tipos;
    this.registros = registros;
    this.privados = privados;
    this.pets = pets;
  }

  tiposDoPet(petId) {
    return this.tipos.listarPorPet(petId);
  }

  buscarTipo(id) {
    return this.tipos.buscarPorId(id);
  }

  nomeDeTipoJaExiste(petId, nome) {
    return this.tipos.existeNome(petId, nome);
  }

  /** Cartões do pet, do mais urgente ao menos urgente (mesma ordem da carteirinha de vacinas). */
  cartoes(petId, hoje = new Date()) {
    const hojeISO = paraISO(hoje);
    const todos = this.registros.listarPorPet(petId);
    return this.tipos
      .listarPorPet(petId)
      .map((tipo) => {
        const registros = todos.filter((r) => r.tipoId === tipo.id);
        const proxima = proximoCuidado(tipo, registros, hojeISO);
        const situacao = situacaoCuidado(tipo, proxima, hojeISO);
        return {
          tipo,
          registros,
          proxima,
          situacao,
          texto: textoCuidado(situacao, registros.length > 0),
          ultimo: textoUltimo(registros, hojeISO),
        };
      })
      .sort(compararPorUrgencia);
  }

  /** Cria o tipo e, se informada, a data do último cuidado, em uma transação. */
  criarTipo({ petId, nome, icone, intervaloDias, dataUltimo = null }) {
    const tipo = new TipoCuidado({ petId, nome, icone, intervaloDias });
    const erros = tipo.validar();
    if (Object.keys(erros).length > 0) throw new ErroValidacaoCuidado(erros);

    Database.get().withTransactionSync(() => {
      this.tipos.salvar(tipo);
      if (dataUltimo) this.registros.salvar(new RegistroCuidado({ tipoId: tipo.id, data: dataUltimo }));
    });
    return tipo;
  }

  excluirTipo(tipoId) {
    Database.get().withTransactionSync(() => this.tipos.excluirComDependencias(tipoId));
  }

  /** Dados de um registro, com o tipo e o valor privado. */
  detalheRegistro(id) {
    const registro = this.registros.buscarPorId(id);
    if (!registro) return null;
    return {
      registro,
      tipo: this.tipos.buscarPorId(registro.tipoId),
      privado: this.privados.buscarPorRegistro(id),
    };
  }

  /** Grava o registro e o valor privado juntos. Sem valor, a parte privada é removida. */
  salvarRegistro({ registro, valorCentavos = null }) {
    const erros = registro.validar();
    if (Object.keys(erros).length > 0) throw new ErroValidacaoCuidado(erros);

    Database.get().withTransactionSync(() => {
      this.registros.salvar(registro);
      const atual = this.privados.buscarPorRegistro(registro.id);
      if (valorCentavos === null) {
        if (atual) this.privados.excluir(atual.id);
      } else {
        const privado = atual ?? new CuidadoPrivado({ registroId: registro.id });
        privado.valorCentavos = valorCentavos;
        this.privados.salvar(privado);
      }
    });
    return registro;
  }

  /** Atalho: registra o cuidado como feito hoje. */
  marcarFeitoHoje(tipoId, hoje = new Date()) {
    return this.salvarRegistro({ registro: new RegistroCuidado({ tipoId, data: paraISO(hoje) }) });
  }

  excluirRegistro(id) {
    Database.get().withTransactionSync(() => this.registros.excluirComDependencias(id));
  }

  /** Próxima data de cada cuidado que cai no intervalo (contrato de evento da agenda). */
  eventos(inicioISO, fimISO, hoje = new Date()) {
    const hojeISO = paraISO(hoje);
    const resultado = [];
    for (const pet of this.pets.listarAtivos()) {
      for (const item of this.cartoes(pet.id, hoje)) {
        if (!item.proxima || item.proxima < inicioISO || item.proxima > fimISO) continue;
        resultado.push(
          criarEvento({
            chave: `cuidado-${item.tipo.id}`,
            petId: pet.id,
            petNome: pet.nome,
            titulo: `${item.tipo.nome} ${pet.deNome}`,
            texto: item.texto,
            data: item.proxima,
            estado: estadoPorData(item.proxima, hojeISO),
            icone: item.tipo.icone,
            rota: { pathname: '/pet/[id]', params: { id: pet.id, aba: 'rotina' } },
          }),
        );
      }
    }
    return resultado;
  }

  /** Cuidados atrasados ou que vencem em breve, como lembretes (contrato Lembrete). */
  lembretes(hoje = new Date()) {
    const resultado = [];
    for (const pet of this.pets.listarAtivos()) {
      for (const item of this.cartoes(pet.id, hoje)) {
        const { estado, dias } = item.situacao;
        if (estado !== 'atrasada' && estado !== 'em-breve') continue;
        resultado.push(
          criarLembrete({
            chave: `cuidado-${item.tipo.id}`,
            petId: pet.id,
            petNome: pet.nome,
            titulo: `${item.tipo.nome} ${pet.deNome}`,
            texto: item.texto,
            dias,
            data: item.proxima,
            icone: item.tipo.icone,
            rota: { pathname: '/pet/[id]', params: { id: pet.id, aba: 'rotina' } },
          }),
        );
      }
    }
    return resultado;
  }
}

export const cuidadoService = new CuidadoService();
