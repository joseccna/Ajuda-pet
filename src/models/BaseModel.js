import { novoId } from '../utils/id';

/**
 * Base de todos os models. Cada model herda os campos padrão (preparados para
 * backup e sincronização): id (UUID), criadoEm, atualizadoEm, excluidoEm e
 * autorDispositivoId.
 *
 * Quem herda precisa implementar toRow().
 */
export class BaseModel {
  constructor(base) {
    const agora = new Date().toISOString();
    this.id = base?.id ?? novoId();
    this.criadoEm = base?.criadoEm ?? agora;
    this.atualizadoEm = base?.atualizadoEm ?? agora;
    this.excluidoEm = base?.excluidoEm ?? null;
    this.autorDispositivoId = base?.autorDispositivoId ?? null;
  }
  /**
   * Colunas do domínio (sem os campos padrão, que o repositório cuida).
   * Deve devolver um objeto { coluna: string | number | null }.
   */
  toRow() {
    throw new Error(`${this.constructor.name} precisa implementar toRow()`);
  }

  /** Lê os campos padrão de uma linha do banco. */
  static baseDeLinha(r) {
    return {
      id: String(r.id),
      criadoEm: String(r.criado_em),
      atualizadoEm: String(r.atualizado_em),
      excluidoEm: r.excluido_em ?? null,
      autorDispositivoId: r.autor_dispositivo_id ?? null,
    };
  }
}
