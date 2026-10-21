import { Database } from '../database/Database';
import { MarcacaoPasseioRepository } from '../database/repositories/MarcacaoPasseioRepository';
import { PasseioRepository } from '../database/repositories/PasseioRepository';
import { PetRepository } from '../database/repositories/PetRepository';
import { criarLembrete } from '../models/Lembrete';
import { MarcacaoPasseio } from '../models/MarcacaoPasseio';
import { Passeio } from '../models/Passeio';
import {
  formatarDuracao,
  minutosDeSegundos,
  percentualMeta,
  minutosDoDia,
  segundosDecorridos,
  semanaAtual,
  ultimoPasseio,
} from '../models/regrasPasseio';
import { paraISO } from '../utils/datas';
import { preferenciasService } from './PreferenciasService';

export class ErroValidacaoPasseio extends Error {
  constructor(erros) {
    super('Dados do passeio inválidos');
    this.name = 'ErroValidacaoPasseio';
    this.erros = erros;
  }
}

/** Regras de passeios: cronômetro com pausa, marcações, registro manual, semana e meta. */
export class PasseioService {
  constructor(
    passeios = new PasseioRepository(),
    marcacoes = new MarcacaoPasseioRepository(),
    pets = new PetRepository(),
    preferencias = preferenciasService,
  ) {
    this.passeios = passeios;
    this.marcacoes = marcacoes;
    this.pets = pets;
    this.preferencias = preferencias;
  }

  buscar(id) {
    return this.passeios.buscarPorId(id);
  }

  listar(petId) {
    return this.passeios.listarPorPet(petId);
  }

  ativo(petId) {
    return this.passeios.emAndamento(petId);
  }

  /** Começa um passeio. Se já há um em andamento para o pet, devolve esse mesmo. */
  iniciar(petId, agora = new Date()) {
    const existente = this.passeios.emAndamento(petId);
    if (existente) return existente;
    return this.passeios.salvar(new Passeio({ petId, inicio: agora.toISOString(), emAndamento: true }));
  }

  pausar(passeioId, agora = new Date()) {
    const p = this.passeios.buscarPorId(passeioId);
    if (!p || !p.emAndamento || p.pausadoDesde) return p;
    p.pausadoDesde = agora.toISOString();
    return this.passeios.salvar(p);
  }

  retomar(passeioId, agora = new Date()) {
    const p = this.passeios.buscarPorId(passeioId);
    if (!p || !p.pausadoDesde) return p;
    p.pausaTotalS += Math.max(0, Math.round((agora.getTime() - new Date(p.pausadoDesde).getTime()) / 1000));
    p.pausadoDesde = null;
    return this.passeios.salvar(p);
  }

  marcacoesDoPasseio(passeioId) {
    return this.marcacoes.listarPorPasseio(passeioId);
  }

  /** Liga ou desliga uma marcação (xixi, cocô...). Devolve true se ficou ligada. */
  alternarMarcacao(passeioId, tipo, agora = new Date()) {
    const existente = this.marcacoes.listarPorPasseio(passeioId).find((m) => m.tipo === tipo);
    if (existente) {
      this.marcacoes.excluir(existente.id);
      return false;
    }
    this.marcacoes.salvar(new MarcacaoPasseio({ passeioId, tipo, horario: agora.toISOString() }));
    return true;
  }

  /** Termina o passeio: fecha a pausa, calcula a duração (mínimo de 1 minuto) e guarda. */
  finalizar(passeioId, agora = new Date()) {
    const p = this.passeios.buscarPorId(passeioId);
    if (!p) return null;
    if (p.pausadoDesde) this.retomar(passeioId, agora);
    const atual = this.passeios.buscarPorId(passeioId);
    atual.fim = agora.toISOString();
    atual.duracaoMin = minutosDeSegundos(segundosDecorridos(atual, agora.getTime()));
    atual.emAndamento = false;
    return this.passeios.salvar(atual);
  }

  /** Completa um passeio recém-terminado com distância e observação (opcionais). */
  concluirDetalhes(passeioId, { distanciaKm = null, observacao = '' }) {
    const p = this.passeios.buscarPorId(passeioId);
    p.distanciaKm = distanciaKm;
    p.observacao = observacao;
    const erros = p.validar();
    if (Object.keys(erros).length > 0) throw new ErroValidacaoPasseio(erros);
    return this.passeios.salvar(p);
  }

  /** Cancela um passeio em andamento, sem guardar nada. */
  descartar(passeioId) {
    this.excluir(passeioId);
  }

  /** Registra um passeio que já aconteceu (esqueceu de iniciar o cronômetro). */
  registrarManual({ petId, data, hora = '12:00', duracaoMin, distanciaKm = null, observacao = '' }) {
    const [a, m, d] = data.split('-').map(Number);
    const [h, mi] = (hora || '12:00').split(':').map(Number);
    const inicio = new Date(a, m - 1, d, h, mi, 0);
    const passeio = new Passeio({
      petId,
      inicio: inicio.toISOString(),
      fim: new Date(inicio.getTime() + (duracaoMin || 0) * 60000).toISOString(),
      duracaoMin,
      distanciaKm,
      observacao,
    });
    return this.salvar(passeio);
  }

  salvar(passeio) {
    const erros = passeio.validar();
    if (Object.keys(erros).length > 0) throw new ErroValidacaoPasseio(erros);
    return this.passeios.salvar(passeio);
  }

  excluir(passeioId) {
    Database.get().withTransactionSync(() => {
      this.marcacoes.excluirPorPasseio(passeioId);
      this.passeios.excluir(passeioId);
    });
  }

  /** Semana (segunda a domingo), meta do dia, último passeio e passeio em andamento. */
  resumo(petId, hoje = new Date()) {
    const hojeISO = paraISO(hoje);
    const todos = this.listar(petId);
    const semana = semanaAtual(todos, hojeISO, this.preferencias.obter().metaPasseioMin);
    const minutosHoje = minutosDoDia(todos, hojeISO);
    return {
      semana,
      minutosHoje,
      percentualMeta: percentualMeta(minutosHoje, semana.metaMin),
      ultimo: ultimoPasseio(todos),
      ativo: todos.find((p) => p.emAndamento) ?? null,
      total: todos.filter((p) => !p.emAndamento).length,
    };
  }

  /** Passeios em andamento aparecem no painel, para o tutor não esquecer o cronômetro aberto. */
  lembretes(hoje = new Date()) {
    const pets = new Map(this.pets.listarAtivos().map((p) => [p.id, p]));
    const resultado = [];
    for (const passeio of this.passeios.emAndamentoDePetsAtivos()) {
      const pet = pets.get(passeio.petId);
      if (!pet) continue;
      const min = Math.max(1, Math.floor(segundosDecorridos(passeio, hoje.getTime()) / 60));
      resultado.push(
        criarLembrete({
          chave: `passeio-${passeio.id}`,
          petId: pet.id,
          petNome: pet.nome,
          titulo: `Passeio ${pet.deNome} em andamento`,
          texto: `${formatarDuracao(min)} até agora`,
          dias: 0,
          data: paraISO(hoje),
          icone: 'timer-outline',
          rota: { pathname: '/pet/[id]/passeio', params: { id: pet.id, passeioId: passeio.id } },
        }),
      );
    }
    return resultado;
  }
}

export const passeioService = new PasseioService();
