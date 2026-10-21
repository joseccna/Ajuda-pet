import { Database } from '../Database';
import { DeviceIdentity } from '../DeviceIdentity';
/**
 * CRUD genérico. Cada repositório define só a tabela, a conversão de linha
 * e as consultas específicas. É o único lugar do app com SQL.
 *
 * Quem herda precisa definir:
 *  - tabela: nome da tabela (propriedade)
 *  - deLinha(linha): converte uma linha do banco em um model
 */
export class BaseRepository {
  get db() {
    return Database.get();
  }

  deLinha(linha) {
    throw new Error(`${this.constructor.name} precisa implementar deLinha()`);
  }

  buscarPorId(id) {
    const linha = this.db.getFirstSync(`SELECT * FROM ${this.tabela} WHERE id = ? AND excluido_em IS NULL`, [
      id,
    ]);
    return linha ? this.deLinha(linha) : null;
  }
  listar() {
    return this.db
      .getAllSync(`SELECT * FROM ${this.tabela} WHERE excluido_em IS NULL`)
      .map((l) => this.deLinha(l));
  }
  /** Insere ou atualiza, preenchendo data de alteração e autor. */
  salvar(modelo) {
    const agora = new Date().toISOString();
    modelo.atualizadoEm = agora;
    modelo.autorDispositivoId = DeviceIdentity.id;
    const colunas = {
      ...modelo.toRow(),
      atualizado_em: agora,
      autor_dispositivo_id: modelo.autorDispositivoId,
    };
    const existe = this.db.getFirstSync(`SELECT 1 AS x FROM ${this.tabela} WHERE id = ?`, [modelo.id]);
    if (existe) {
      const nomes = Object.keys(colunas);
      const sets = nomes.map((n) => `${n} = ?`).join(', ');
      this.db.runSync(`UPDATE ${this.tabela} SET ${sets} WHERE id = ?`, [
        ...nomes.map((n) => colunas[n]),
        modelo.id,
      ]);
    } else {
      const todas = { id: modelo.id, criado_em: modelo.criadoEm, ...colunas };
      const nomes = Object.keys(todas);
      const marcas = nomes.map(() => '?').join(', ');
      this.db.runSync(`INSERT INTO ${this.tabela} (${nomes.join(', ')}) VALUES (${marcas})`, [
        ...nomes.map((n) => todas[n]),
      ]);
    }
    return modelo;
  }
  /** Exclusão lógica: o registro some das listas, mas continua no banco e vai junto no backup. */
  excluir(id) {
    const agora = new Date().toISOString();
    this.db.runSync(
      `UPDATE ${this.tabela} SET excluido_em = ?, atualizado_em = ?, autor_dispositivo_id = ? WHERE id = ?`,
      [agora, agora, DeviceIdentity.id, id],
    );
  }
}
