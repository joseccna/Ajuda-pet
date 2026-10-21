import { Database } from '../Database';
import { NOMES_TABELAS } from '../../models/regrasBackup';

function garantirTabela(nome) {
  if (!NOMES_TABELAS.includes(nome)) throw new Error(`Tabela não permitida: ${nome}`);
  return nome;
}

/**
 * Leitura e gravação em bloco para backup e importação. Usa só nomes de tabela da lista fixa
 * e só colunas que existem de verdade no banco, nunca nomes vindos de um arquivo.
 */
export class BackupRepository {
  get db() {
    return Database.get();
  }

  versaoDoEsquema() {
    return this.db.getFirstSync('PRAGMA user_version')?.user_version ?? 0;
  }

  /** Todas as linhas (inclusive as apagadas, que carregam a data da exclusão) das tabelas pedidas. */
  lerTabelas(nomes) {
    const saida = {};
    for (const nome of nomes) {
      saida[garantirTabela(nome)] = this.db.getAllSync(`SELECT * FROM ${nome}`);
    }
    return saida;
  }

  /** { tabela: Map(id -> { atualizado_em, excluido_em }) } do que já existe neste aparelho. */
  idsLocais(nomes = NOMES_TABELAS) {
    const saida = {};
    for (const nome of nomes) {
      garantirTabela(nome);
      const mapa = new Map();
      for (const l of this.db.getAllSync(`SELECT id, atualizado_em, excluido_em FROM ${nome}`)) {
        mapa.set(l.id, { atualizado_em: l.atualizado_em, excluido_em: l.excluido_em });
      }
      saida[nome] = mapa;
    }
    return saida;
  }

  colunas(tabela) {
    garantirTabela(tabela);
    return new Set(this.db.getAllSync(`PRAGMA table_info(${tabela})`).map((c) => c.name));
  }

  temDados() {
    return Boolean(this.db.getFirstSync('SELECT 1 AS x FROM pets LIMIT 1'));
  }

  /**
   * Grava as linhas em uma transação só: tudo entra ou nada entra.
   * Uma linha que o banco recusar (por exemplo, duas anotações ativas para a mesma consulta)
   * é pulada e relatada, sem desfazer o resto.
   */
  aplicar(linhas) {
    const falhas = [];
    let aplicadas = 0;
    const cache = new Map();
    const colunasDe = (t) => {
      if (!cache.has(t)) cache.set(t, this.colunas(t));
      return cache.get(t);
    };
    this.db.withTransactionSync(() => {
      for (const { tabela, acao, linha } of linhas) {
        const permitidas = colunasDe(tabela);
        const nomes = Object.keys(linha).filter((c) => permitidas.has(c));
        try {
          if (acao === 'inserir') {
            this.db.runSync(
              `INSERT INTO ${tabela} (${nomes.join(', ')}) VALUES (${nomes.map(() => '?').join(', ')})`,
              nomes.map((c) => linha[c]),
            );
          } else {
            const mudar = nomes.filter((c) => c !== 'id');
            this.db.runSync(`UPDATE ${tabela} SET ${mudar.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`, [
              ...mudar.map((c) => linha[c]),
              linha.id,
            ]);
          }
          aplicadas += 1;
        } catch (e) {
          falhas.push({ tabela, id: linha.id, erro: e instanceof Error ? e.message : String(e) });
        }
      }
    });
    return { aplicadas, falhas };
  }
}
