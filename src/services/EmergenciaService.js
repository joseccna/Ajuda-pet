import { montarCartao } from '../models/regrasEmergencia';
import { PetRepository } from '../database/repositories/PetRepository';
import { pesoService } from './PesoService';
import { preferenciasService } from './PreferenciasService';
import { tutorService } from './TutorService';
import { vacinaService } from './VacinaService';

/** Junta os dados do pet, da carteirinha, do peso e do tutor no cartão de emergência. */
export class EmergenciaService {
  constructor(
    pets = new PetRepository(),
    peso = pesoService,
    vacinas = vacinaService,
    tutores = tutorService,
    preferencias = preferenciasService,
  ) {
    this.pets = pets;
    this.peso = peso;
    this.vacinas = vacinas;
    this.tutores = tutores;
    this.preferencias = preferencias;
  }

  cartao(petId, hoje = new Date()) {
    const pet = this.pets.buscarPorId(petId);
    if (!pet) return null;
    return {
      pet,
      cartao: montarCartao({
        pet,
        pesoG: this.peso.resumo(petId, '6m', hoje).atual?.pesoG ?? null,
        cartoesVacina: this.vacinas.carteirinha(petId, hoje),
        tutor: this.tutores.atual(),
        unidadePeso: this.preferencias.obter().unidadePeso,
      }),
    };
  }
}

export const emergenciaService = new EmergenciaService();
