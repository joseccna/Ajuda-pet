import { Database } from '../database/Database';
import { FotoRepository } from '../database/repositories/FotoRepository';
import { PetRepository } from '../database/repositories/PetRepository';
import { Foto } from '../models/Foto';
import { paraISO } from '../utils/datas';
import { FotoService } from './FotoService';

/**
 * Galeria de fotos do pet. A foto de capa é a foto do pet (Pet.fotoUri): ela sempre faz parte da galeria,
 * então trocar a capa nunca apaga a foto anterior.
 */
export class GaleriaService {
  constructor(fotos = new FotoRepository(), pets = new PetRepository()) {
    this.fotos = fotos;
    this.pets = pets;
  }

  /** Fotos do pet. Se a capa ainda não está na galeria (pets cadastrados antes da galeria), entra agora. */
  listar(petId) {
    const pet = this.pets.buscarPorId(petId);
    if (pet?.fotoUri) this.registrarSeNaoExiste(petId, pet.fotoUri);
    return this.fotos.listarPorPet(petId);
  }

  buscar(id) {
    return this.fotos.buscarPorId(id);
  }

  contar(petId) {
    return this.fotos.contarPorPet(petId);
  }

  /** Coloca na galeria uma foto que já está guardada (a capa, por exemplo), se ainda não estiver. */
  registrarSeNaoExiste(petId, uri, hoje = new Date()) {
    if (this.fotos.buscarPorUri(petId, uri)) return null;
    return this.fotos.salvar(new Foto({ petId, uri, data: paraISO(hoje) }));
  }

  /** Guarda as fotos escolhidas (itens: { uri, thumbUri } temporários) e as registra na galeria. */
  adicionar(petId, itens, hoje = new Date()) {
    const guardados = itens.map((i) => ({
      uri: FotoService.ehTemporaria(i.uri) ? FotoService.guardarGaleria(i.uri, petId) : i.uri,
      thumbUri:
        i.thumbUri && FotoService.ehTemporaria(i.thumbUri)
          ? FotoService.guardarMiniatura(i.thumbUri, petId)
          : (i.thumbUri ?? null),
    }));
    try {
      const fotos = guardados.map(
        (g) => new Foto({ petId, uri: g.uri, thumbUri: g.thumbUri, data: paraISO(hoje) }),
      );
      Database.get().withTransactionSync(() => fotos.forEach((f) => this.fotos.salvar(f)));
      return fotos;
    } catch (e) {
      guardados.forEach((g) => {
        FotoService.apagar(g.uri);
        FotoService.apagar(g.thumbUri);
      });
      throw e;
    }
  }

  atualizarLegenda(id, legenda) {
    const f = this.fotos.buscarPorId(id);
    if (!f) return null;
    f.legenda = legenda.slice(0, 120);
    return this.fotos.salvar(f);
  }

  /** Esta foto passa a ser a foto do pet (a que aparece nos cartões e no perfil). */
  definirCapa(fotoId) {
    const f = this.fotos.buscarPorId(fotoId);
    if (!f) return null;
    const pet = this.pets.buscarPorId(f.petId);
    if (!pet) return null;
    pet.fotoUri = f.uri;
    this.pets.salvar(pet);
    return pet;
  }

  /** Arquivo da foto de capa do pet (ou null). */
  capaUri(petId) {
    return this.pets.buscarPorId(petId)?.fotoUri ?? null;
  }

  ehCapa(foto) {
    return this.pets.buscarPorId(foto.petId)?.fotoUri === foto.uri;
  }

  /** Apaga as fotos e os arquivos. Se uma delas era a capa, o pet fica sem foto. */
  excluir(ids) {
    const fotos = ids.map((id) => this.fotos.buscarPorId(id)).filter(Boolean);
    Database.get().withTransactionSync(() => {
      this.fotos.excluirVarias(fotos.map((f) => f.id));
      for (const f of fotos) {
        const pet = this.pets.buscarPorId(f.petId);
        if (pet && pet.fotoUri === f.uri) {
          pet.fotoUri = null;
          this.pets.salvar(pet);
        }
      }
    });
    for (const f of fotos) {
      FotoService.apagar(f.uri);
      FotoService.apagar(f.thumbUri);
    }
  }

  /** O arquivo ainda é usado por alguma foto da galeria? (para não apagar um arquivo em uso) */
  uriEmUso(uri) {
    return this.fotos.uriEmUso(uri);
  }
}

export const galeriaService = new GaleriaService();
