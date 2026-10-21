import * as SQLite from 'expo-sqlite';
import { MIGRACOES } from './migracoes';
/** Conexão única com o SQLite e controle de versão do esquema. */
export class Database {
  static {
    this.instancia = null;
  }
  static get() {
    if (!Database.instancia) {
      const db = SQLite.openDatabaseSync('ajudapet.db');
      db.execSync('PRAGMA journal_mode = WAL;');
      db.execSync('PRAGMA foreign_keys = ON;');
      Database.instancia = db;
    }
    return Database.instancia;
  }
  /** Cria as tabelas e aplica as migrações que faltam, cada uma em uma transação. */
  static iniciar() {
    const db = Database.get();
    const atual = db.getFirstSync('PRAGMA user_version');
    const versao = atual?.user_version ?? 0;
    MIGRACOES.forEach((sql, indice) => {
      const alvo = indice + 1;
      if (alvo <= versao) return;
      db.withTransactionSync(() => {
        db.execSync(sql);
        db.execSync(`PRAGMA user_version = ${alvo};`);
      });
    });
  }
}
