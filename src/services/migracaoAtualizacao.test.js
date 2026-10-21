/**
 * Caminho de atualização do banco: um aparelho que já está na versão 3 (peso e consultas)
 * recebe as migrações novas sem perder dados, e os bugs corrigidos ficam corrigidos.
 */
jest.mock('expo-sqlite', () => {
  const sqlite = process.getBuiltinModule?.('node:sqlite');
  if (!sqlite) return {};
  const { criarAdaptador } = require('../testes/sqliteNode');
  return { openDatabaseSync: () => criarAdaptador(sqlite.DatabaseSync) };
});

import { Database } from '../database/Database';
import { MIGRACOES } from '../database/migracoes';

const temSqlite = Boolean(process.getBuiltinModule?.('node:sqlite'));
const suite = temSqlite ? describe : describe.skip;

suite('atualização do banco da versão 3 para a mais recente', () => {
  let db;

  beforeAll(() => {
    db = Database.get();
    // Reproduz um aparelho que parou na migração 3.
    for (let i = 0; i < 3; i++) db.execSync(MIGRACOES[i]);
    db.execSync('PRAGMA user_version = 3');

    const agora = '2026-10-01T12:00:00.000Z';
    db.runSync(
      `INSERT INTO pets (id, nome, especie, criado_em, atualizado_em) VALUES ('pet1', 'Luna', 'cachorro', ?, ?)`,
      [agora, agora],
    );
    db.runSync(
      `INSERT INTO consultas (id, pet_id, data, motivo, criado_em, atualizado_em) VALUES ('c1', 'pet1', '2026-09-03', 'Alergia', ?, ?)`,
      [agora, agora],
    );
    db.runSync(
      `INSERT INTO consultas_privadas (id, consulta_id, valor_centavos, anotacoes, criado_em, atualizado_em)
       VALUES ('p1', 'c1', 28000, 'Pedir desconto', ?, ?)`,
      [agora, agora],
    );
  });

  it('aplica as migrações que faltam sem perder os dados privados', () => {
    expect(db.getFirstSync('PRAGMA user_version').user_version).toBe(3);
    Database.iniciar();
    expect(db.getFirstSync('PRAGMA user_version').user_version).toBe(MIGRACOES.length);

    const linha = db.getFirstSync('SELECT * FROM consultas_privadas WHERE id = ?', ['p1']);
    expect(linha.valor_centavos).toBe(28000);
    expect(linha.anotacoes).toBe('Pedir desconto');
    expect(linha.consulta_id).toBe('c1');
  });

  it('depois de apagar a parte privada, dá para criar outra para a mesma consulta', () => {
    const agora = '2026-10-02T12:00:00.000Z';
    db.runSync('UPDATE consultas_privadas SET excluido_em = ? WHERE id = ?', [agora, 'p1']);
    expect(() =>
      db.runSync(
        `INSERT INTO consultas_privadas (id, consulta_id, valor_centavos, criado_em, atualizado_em) VALUES ('p2', 'c1', 31000, ?, ?)`,
        [agora, agora],
      ),
    ).not.toThrow();
  });

  it('mas continua valendo um só valor privado ativo por consulta', () => {
    const agora = '2026-10-02T12:00:00.000Z';
    expect(() =>
      db.runSync(
        `INSERT INTO consultas_privadas (id, consulta_id, valor_centavos, criado_em, atualizado_em) VALUES ('p3', 'c1', 1, ?, ?)`,
        [agora, agora],
      ),
    ).toThrow();
  });

  it('rodar de novo não refaz nada', () => {
    Database.iniciar();
    expect(db.getFirstSync('PRAGMA user_version').user_version).toBe(MIGRACOES.length);
    expect(db.getFirstSync('SELECT COUNT(*) AS n FROM consultas_privadas').n).toBe(2);
  });
});
