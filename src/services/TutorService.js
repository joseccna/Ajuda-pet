import { TutorRepository } from '../database/repositories/TutorRepository';
import { Tutor } from '../models/Tutor';

export class ErroValidacaoTutor extends Error {
  constructor(erros) {
    super('Dados do tutor inválidos');
    this.name = 'ErroValidacaoTutor';
    this.erros = erros;
  }
}

/** Perfil do tutor e contatos de confiança. Há um perfil só por aparelho. */
export class TutorService {
  constructor(repo = new TutorRepository()) {
    this.repo = repo;
  }

  /** O perfil salvo, ou um perfil vazio (ainda não salvo) se o tutor não preencheu nada. */
  obter() {
    return this.repo.atual() ?? new Tutor();
  }

  /** Só devolve o perfil se já foi preenchido. */
  atual() {
    const t = this.repo.atual();
    return t && t.preenchido ? t : null;
  }

  salvar(tutor) {
    const erros = tutor.validar();
    if (Object.keys(erros).length > 0) throw new ErroValidacaoTutor(erros);
    return this.repo.salvar(tutor);
  }
}

export const tutorService = new TutorService();
