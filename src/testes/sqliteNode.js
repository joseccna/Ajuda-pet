/**
 * Adaptador de teste: imita a API síncrona do expo-sqlite usando o SQLite embutido do Node.
 * Permite testar migrações, repositórios e serviços com SQL de verdade, sem celular.
 */
export function criarAdaptador(DatabaseSync) {
  const db = new DatabaseSync(':memory:');
  return {
    execSync: (sql) => db.exec(sql),
    runSync: (sql, params = []) => {
      const r = db.prepare(sql).run(...params);
      return { lastInsertRowId: Number(r.lastInsertRowid), changes: r.changes };
    },
    getFirstSync: (sql, params = []) => db.prepare(sql).get(...params) ?? null,
    getAllSync: (sql, params = []) => db.prepare(sql).all(...params),
    withTransactionSync: (fn) => {
      db.exec('BEGIN');
      try {
        fn();
        db.exec('COMMIT');
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }
    },
  };
}
