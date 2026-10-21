import { Database } from '../database/Database';
import { HomenagemRepository } from '../database/repositories/HomenagemRepository';
import { MarcoMemorialRepository } from '../database/repositories/MarcoMemorialRepository';
import { PetRepository } from '../database/repositories/PetRepository';
import { Homenagem } from '../models/Homenagem';
import { ordenarMarcos, validarDespedida, validarHomenagem } from '../models/regrasMemorial';
import { galeriaService } from './GaleriaService';

export class ErroValidacaoMemorial extends Error {
  constructor(erros) {
    super('Dados do memorial inválidos');
    this.name = 'ErroValidacaoMemorial';
    this.erros = erros;
  }
}

/**
 * Memorial dos pets que já partiram. Registrar a despedida tira o pet da lista e do painel e pausa os lembretes
 * (todos os módulos já ignoram pets que não estão ativos). Nada é apagado: dá para desfazer a qualquer momento.
 */
export class MemorialService {
  constructor(
    pets = new PetRepository(),
    homenagens = new HomenagemRepository(),
    marcos = new MarcoMemorialRepository(),
    galeria = galeriaService,
  ) {
    this.pets = pets;
    this.repoHomenagens = homenagens;
    this.repoMarcos = marcos;
    this.galeria = galeria;
  }

  /** Pets em memorial. */
  listar() {
    return this.pets.listarMemorial();
  }

  /**
   * Registra a despedida (ou corrige a data, se o pet já estava no memorial) e, se houver, a mensagem.
   * Tudo em uma transação.
   */
  registrarDespedida(petId, { dataISO, mensagem = '' }, hoje = new Date()) {
    const pet = this.pets.buscarPorId(petId);
    if (!pet) throw new Error('Pet não encontrado');

    const erros = {
      ...validarDespedida({ dataISO, nascimento: pet.nascimento }, hoje),
      ...validarHomenagem(mensagem),
    };
    if (Object.keys(erros).length > 0) throw new ErroValidacaoMemorial(erros);

    Database.get().withTransactionSync(() => {
      pet.marcarComoFalecido(dataISO);
      this.pets.salvar(pet);
      if (mensagem.trim() !== '') this.salvarHomenagem(petId, mensagem);
    });
    return pet;
  }

  /** O pet volta para a lista e os lembretes dele voltam a valer. */
  desfazerDespedida(petId) {
    const pet = this.pets.buscarPorId(petId);
    if (!pet) return null;
    pet.desfazerFalecimento();
    return this.pets.salvar(pet);
  }

  homenagem(petId) {
    return this.repoHomenagens.doPet(petId)?.texto ?? '';
  }

  /** Guarda a homenagem (atualiza a que já existe). Texto vazio apaga. */
  salvarHomenagem(petId, texto) {
    const erros = validarHomenagem(texto);
    if (Object.keys(erros).length > 0) throw new ErroValidacaoMemorial(erros);

    const existente = this.repoHomenagens.doPet(petId);
    if (texto.trim() === '') {
      if (existente) this.repoHomenagens.excluir(existente.id);
      return null;
    }
    const h = existente ?? new Homenagem({ petId });
    h.texto = texto;
    return this.repoHomenagens.salvar(h);
  }

  marcos(petId) {
    return ordenarMarcos(this.repoMarcos.listarPorPet(petId));
  }

  buscarMarco(id) {
    return this.repoMarcos.buscarPorId(id);
  }

  salvarMarco(marco) {
    const erros = marco.validar();
    if (Object.keys(erros).length > 0) throw new ErroValidacaoMemorial(erros);
    return this.repoMarcos.salvar(marco);
  }

  excluirMarco(id) {
    this.repoMarcos.excluir(id);
  }

  /** Tudo da página do memorial: o pet, a homenagem, a linha do tempo e as fotos. */
  resumo(petId) {
    const pet = this.pets.buscarPorId(petId);
    if (!pet) return null;
    return {
      pet,
      homenagem: this.homenagem(petId),
      marcos: this.marcos(petId),
      fotos: this.galeria.listar(petId),
    };
  }
}

export const memorialService = new MemorialService();
