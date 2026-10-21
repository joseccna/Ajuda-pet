import { Database } from '../database/Database';
import { PetRepository } from '../database/repositories/PetRepository';
import { PlanoAlimentarRepository } from '../database/repositories/PlanoAlimentarRepository';
import { RefeicaoRegistroRepository } from '../database/repositories/RefeicaoRegistroRepository';
import { criarLembrete } from '../models/Lembrete';
import { RefeicaoRegistro } from '../models/RefeicaoRegistro';
import { refeicoesDoDia, refeicoesParaLembrar } from '../models/regrasAlimentacao';
import { paraISO, somarDias } from '../utils/datas';

export class ErroValidacaoPlano extends Error {
  constructor(erros) {
    super('Dados do plano alimentar inválidos');
    this.name = 'ErroValidacaoPlano';
    this.erros = erros;
  }
}

/** Regras de alimentação: plano em vigor, histórico de planos, refeições do dia e lembretes. */
export class AlimentacaoService {
  constructor(
    planos = new PlanoAlimentarRepository(),
    refeicoes = new RefeicaoRegistroRepository(),
    pets = new PetRepository(),
  ) {
    this.planos = planos;
    this.refeicoes = refeicoes;
    this.pets = pets;
  }

  planoVigente(petId) {
    return this.planos.vigente(petId);
  }

  historicoPlanos(petId) {
    return this.planos.historico(petId);
  }

  /**
   * Cria o plano. Se já existe um em vigor, ele é encerrado no dia anterior e guardado no histórico
   * (ou apagado, se foi criado hoje e nunca chegou a valer um dia inteiro).
   */
  criarPlano(plano, hoje = new Date()) {
    const hojeISO = paraISO(hoje);
    plano.inicio = hojeISO;
    plano.fim = null;
    const erros = plano.validar();
    if (Object.keys(erros).length > 0) throw new ErroValidacaoPlano(erros);

    Database.get().withTransactionSync(() => {
      const atual = this.planos.vigente(plano.petId);
      if (atual) {
        if (atual.inicio >= hojeISO) {
          this.planos.excluir(atual.id);
        } else {
          atual.fim = somarDias(hojeISO, -1);
          this.planos.salvar(atual);
        }
      }
      this.planos.salvar(plano);
    });
    return plano;
  }

  /** Corrige o plano em vigor sem criar uma nova versão (por exemplo, um erro de digitação). */
  corrigirPlano(plano) {
    const erros = plano.validar();
    if (Object.keys(erros).length > 0) throw new ErroValidacaoPlano(erros);
    return this.planos.salvar(plano);
  }

  /** Plano em vigor e as refeições de hoje, com o que já foi feito. */
  refeicoesDeHoje(petId, agora = new Date()) {
    const plano = this.planoVigente(petId);
    if (!plano) return { plano: null, refeicoes: [] };
    const registros = this.refeicoes.doDia(petId, paraISO(agora)).filter((r) => r.planoId === plano.id);
    return { plano, refeicoes: refeicoesDoDia(plano, registros, agora) };
  }

  /** Marca a refeição como feita ou desmarca. Devolve true se ficou marcada. */
  alternarRefeicao(plano, horario, hoje = new Date()) {
    const dataISO = paraISO(hoje);
    const existentes = this.refeicoes
      .doDia(plano.petId, dataISO)
      .filter((r) => r.planoId === plano.id && r.horario === horario);

    if (existentes.length > 0) {
      Database.get().withTransactionSync(() => existentes.forEach((r) => this.refeicoes.excluir(r.id)));
      return false;
    }
    this.refeicoes.salvar(
      new RefeicaoRegistro({ planoId: plano.id, petId: plano.petId, data: dataISO, horario }),
    );
    return true;
  }

  /** Refeições de hoje que ainda não foram feitas e já passaram ou chegam na próxima hora. */
  lembretes(hoje = new Date()) {
    const dataISO = paraISO(hoje);
    const pets = new Map(this.pets.listarAtivos().map((p) => [p.id, p]));
    const marcadas = this.refeicoes.doDiaDeTodos(dataISO);
    const resultado = [];

    for (const plano of this.planos.vigentesDePetsAtivos()) {
      const pet = pets.get(plano.petId);
      if (!pet || !plano.lembretes) continue;
      const doPlano = marcadas.filter((m) => m.planoId === plano.id);
      const pendentes = refeicoesParaLembrar(refeicoesDoDia(plano, doPlano, hoje), hoje);
      for (const r of pendentes) {
        resultado.push(
          criarLembrete({
            chave: `refeicao-${plano.id}-${r.horario}`,
            petId: pet.id,
            petNome: pet.nome,
            titulo: `Refeição ${pet.deNome}`,
            texto: `Hoje, ${r.horario}`,
            dias: 0,
            data: dataISO,
            icone: 'restaurant-outline',
            rota: { pathname: '/pet/[id]', params: { id: pet.id, aba: 'rotina' } },
          }),
        );
      }
    }
    return resultado;
  }
}

export const alimentacaoService = new AlimentacaoService();
