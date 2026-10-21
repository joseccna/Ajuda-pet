import { PetRepository } from '../database/repositories/PetRepository';
import { DeviceIdentity } from '../database/DeviceIdentity';
import { FotoService } from './FotoService';
import { GaleriaService } from './GaleriaService';
export class ErroValidacao extends Error {
  constructor(erros) {
    super('Dados do pet inválidos');
    this.erros = erros;
    this.name = 'ErroValidacao';
  }
}
/** Regras de negócio dos pets. As telas falam só com este serviço. */
export class PetService {
  constructor(repo = new PetRepository(), galeria = new GaleriaService()) {
    this.repo = repo;
    this.galeria = galeria;
  }
  listarAtivos() {
    return this.repo.listarAtivos();
  }
  listarMemorial() {
    return this.repo.listarMemorial();
  }
  buscar(id) {
    return this.repo.buscarPorId(id);
  }
  nomeJaExiste(nome, ignorarId) {
    return this.repo.existeNome(nome, ignorarId);
  }
  /**
   * Valida, guarda a foto (se for nova) e grava o pet.
   * Se a foto mudou, a anterior é apagada.
   */
  salvar(pet) {
    const erros = pet.validar();
    if (Object.keys(erros).length > 0) throw new ErroValidacao(erros);
    const anterior = this.repo.buscarPorId(pet.id);
    const fotoAnterior = anterior?.fotoUri ?? null;
    if (pet.fotoUri && FotoService.ehTemporaria(pet.fotoUri)) {
      pet.fotoUri = FotoService.guardar(pet.fotoUri, pet.id);
    }
    if (!anterior) pet.donoDispositivoId = DeviceIdentity.id;
    const salvo = this.repo.salvar(pet);
    // A foto do pet também fica na galeria; o arquivo anterior só é apagado se nenhuma foto da galeria o usa.
    if (salvo.fotoUri) this.galeria.registrarSeNaoExiste(salvo.id, salvo.fotoUri);
    if (fotoAnterior && fotoAnterior !== salvo.fotoUri && !this.galeria.uriEmUso(fotoAnterior)) {
      FotoService.apagar(fotoAnterior);
    }
    return salvo;
  }
  excluir(id) {
    this.repo.excluir(id);
  }
}
export const petService = new PetService();
