import { PetRepository } from '../database/repositories/PetRepository';
import { RegistroPesoRepository } from '../database/repositories/RegistroPesoRepository';
import { criarLembrete } from '../models/Lembrete';
import {
  DIAS_SEM_PESAR,
  diasDesdeUltima,
  filtrarPeriodo,
  saltoSuspeito,
  temVariacaoRelevante,
  variacaoDaSerie,
} from '../models/regrasPeso';
import { idadeEmMeses, paraISO } from '../utils/datas';
import { preferenciasService } from './PreferenciasService';

export class ErroValidacaoPeso extends Error {
  constructor(erros) {
    super('Dados da pesagem inválidos');
    this.name = 'ErroValidacaoPeso';
    this.erros = erros;
  }
}

/** Regras de peso: registrar, resumir por período, conferir saltos e sugerir nova pesagem. */
export class PesoService {
  constructor(
    registros = new RegistroPesoRepository(),
    pets = new PetRepository(),
    preferencias = preferenciasService,
  ) {
    this.registros = registros;
    this.pets = pets;
    this.preferencias = preferencias;
  }

  /** Pesagens do pet, da mais recente para a mais antiga. */
  listar(petId) {
    return this.registros.listarPorPet(petId);
  }

  buscar(id) {
    return this.registros.buscarPorId(id);
  }

  salvar(registro) {
    const erros = registro.validar();
    if (Object.keys(erros).length > 0) throw new ErroValidacaoPeso(erros);
    return this.registros.salvar(registro);
  }

  excluir(id) {
    this.registros.excluir(id);
  }

  /**
   * Se o novo peso for muito diferente do último, devolve esse último registro para
   * a tela perguntar "Confere?". Caso contrário, devolve null.
   */
  conferirSalto(petId, gramas, ignorarId) {
    const ultimo = this.listar(petId).find((r) => r.id !== ignorarId);
    return ultimo && saltoSuspeito(ultimo.pesoG, gramas) ? ultimo : null;
  }

  /** Tudo que a seção Peso precisa: série do período, peso atual, variação e aviso. */
  resumo(petId, periodo = '6m', hoje = new Date()) {
    const hojeISO = paraISO(hoje);
    const todos = this.listar(petId).filter((r) => r.data <= hojeISO);
    const serie = filtrarPeriodo(todos, periodo, hojeISO);
    const pet = this.pets.buscarPorId(petId);
    const meses = pet?.nascimento ? idadeEmMeses(pet.nascimento, hoje) : null;
    return {
      registros: this.listar(petId),
      serie,
      atual: todos[0] ?? null,
      variacao: variacaoDaSerie(serie),
      avisoVariacao: temVariacaoRelevante(todos, hojeISO, meses),
    };
  }

  /** Sugere uma nova pesagem quando faz mais de 30 dias. É um lembrete gentil, sem tom de cobrança. */
  lembretes(hoje = new Date()) {
    if (!this.preferencias.obter().sugerirPesagem) return [];
    const hojeISO = paraISO(hoje);
    const resultado = [];
    for (const pet of this.pets.listarAtivos()) {
      const dias = diasDesdeUltima(this.listar(pet.id), hojeISO);
      if (dias === null || dias <= DIAS_SEM_PESAR) continue;
      resultado.push(
        criarLembrete({
          chave: `peso-${pet.id}`,
          petId: pet.id,
          petNome: pet.nome,
          titulo: `Nova pesagem ${pet.deNome}`,
          texto: `Última pesagem há ${dias} dias`,
          dias: 0,
          data: hojeISO,
          icone: 'scale-outline',
          rota: { pathname: '/pet/[id]', params: { id: pet.id, aba: 'saude', secao: 'peso' } },
        }),
      );
    }
    return resultado;
  }
}

export const pesoService = new PesoService();
