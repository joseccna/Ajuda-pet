import { PreferenciasRepository } from '../database/repositories/PreferenciasRepository';
import { Preferencias } from '../models/Preferencias';
import { PADROES, normalizar } from '../models/regrasPreferencias';

/**
 * Preferências do tutor. Guarda uma cópia em memória depois da primeira leitura, então os serviços
 * podem consultar na hora, sem ir ao banco toda vez. Quem quiser saber das mudanças usa assinar().
 */
export class PreferenciasService {
  constructor(repo = new PreferenciasRepository()) {
    this.repo = repo;
    this.cache = null;
    this.ouvintes = new Set();
  }

  /** Preferências atuais (os padrões, se o tutor ainda não mudou nada). */
  obter() {
    if (!this.cache) {
      const linha = this.repo.atual();
      this.cache = linha ? linha.valores : normalizar(PADROES);
    }
    return this.cache;
  }

  /** Muda uma ou mais preferências. Valores inválidos são corrigidos para o padrão. Devolve o resultado. */
  salvar(parcial) {
    const modelo = this.repo.atual() ?? new Preferencias();
    modelo.definir({ ...modelo.valores, ...parcial });
    this.repo.salvar(modelo);
    this.cache = modelo.valores;
    this.ouvintes.forEach((cb) => cb(this.cache));
    return this.cache;
  }

  /** Chama cb(preferencias) a cada mudança. Devolve uma função para parar de ouvir. */
  assinar(cb) {
    this.ouvintes.add(cb);
    return () => this.ouvintes.delete(cb);
  }
}

export const preferenciasService = new PreferenciasService();
