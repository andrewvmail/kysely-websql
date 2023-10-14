import {
  CompiledQuery,
  DatabaseConnection,
  DatabaseIntrospector,
  Dialect,
  Driver,
  Kysely,
  SqliteAdapter,
  SqliteIntrospector,
  SqliteQueryCompiler,
  QueryCompiler,
  QueryResult,
} from "kysely";

/**
 * Config for the WebSQL dialect.
 */
export interface WebSQLDialectConfig {
  database: Database;
}

/**
 *
 * ```typescript
 * new WebSQLDialect({
 *   database: window.openDatabaseSync(name, version, displayName, estimatedSize)
 * })
 * ```
 *
 */
export class WebSQLDialect implements Dialect {
  #config: Database;

  constructor(config: Database) {
    this.#config = config;
  }

  createAdapter() {
    return new SqliteAdapter();
  }

  createDriver(): Driver {
    return new WebSQLDriver(this.#config);
  }

  createQueryCompiler(): QueryCompiler {
    return new SqliteQueryCompiler();
  }

  createIntrospector(db: Kysely<any>): DatabaseIntrospector {
    return new SqliteIntrospector(db);
  }
}

class WebSQLDriver implements Driver {
  #config: Database;

  constructor(config: Database) {
    this.#config = config;
  }

  async init(): Promise<void> {}

  async acquireConnection(): Promise<DatabaseConnection> {
    return new WebSQLConnection(this.#config);
  }

  async beginTransaction(conn: WebSQLConnection): Promise<void> {
    return await conn.beginTransaction();
  }

  async commitTransaction(conn: WebSQLConnection): Promise<void> {
    return await conn.commitTransaction();
  }

  async rollbackTransaction(conn: WebSQLConnection): Promise<void> {
    return await conn.rollbackTransaction();
  }

  async releaseConnection(_conn: WebSQLConnection): Promise<void> {}

  async destroy(): Promise<void> {}
}

class WebSQLConnection implements DatabaseConnection {
  #database: Database;

  constructor(config: Database) {
    this.#database = config;
  }

  async executeQuery<O>(compiledQuery: CompiledQuery): Promise<QueryResult<O>> {
    return new Promise((resolve, reject) => {
      this.#database.transaction((tx) => {
        tx.executeSql(
          compiledQuery.sql,
          compiledQuery.parameters as any[],
          function onSuccess(tx, results) {
            const rows = [];
            const len = results.rows.length;
            for (let i = 0; i < len; i++) {
              rows.push(results.rows.item(i));
            }
            return resolve({
              insertId: results.insertId ? BigInt(results.insertId) : undefined,
              rows,
              numAffectedRows: BigInt(results.rowsAffected),
            });
          },
          function onError(tx, error) {
            reject(`${error.code} ${error.message}`);
          },
        );
      });
    });
  }

  async beginTransaction() {
    throw new Error("Transactions are not supported yet.");
  }

  async commitTransaction() {
    throw new Error("Transactions are not supported yet.");
  }

  async rollbackTransaction() {
    throw new Error("Transactions are not supported yet.");
  }

  async *streamQuery<O>(
    _compiledQuery: CompiledQuery,
    _chunkSize: number
  ): AsyncIterableIterator<QueryResult<O>> {
    throw new Error("WebSQL Driver does not support streaming");
  }
}
