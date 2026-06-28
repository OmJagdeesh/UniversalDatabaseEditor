import pg from 'pg';
import { randomUUID } from 'node:crypto';
import { DatabaseProvider } from '../base/DatabaseProvider.js';
import { PROVIDER_TYPES } from '../../constants/providerTypes.js';
import { logger } from '../../config/logger.js';

const { Pool } = pg;

export class PostgreSQLProvider extends DatabaseProvider {
  constructor() {
    super({
      type: PROVIDER_TYPES.POSTGRESQL,
      displayName: 'PostgreSQL',
      capabilities: {
        fileBased: false,
        connectionString: true,
        schemas: true,
        collections: false,
        sql: true
      }
    });

    /** @type {Map<string, pg.Pool>} */
    this.connections = new Map();
  }

  // --- Connection lifecycle ---

  async connect(config) {
    const connectionId = randomUUID();
    const poolConfig = config.connectionString
      ? { connectionString: config.connectionString, max: 10 }
      : {
          host: config.host,
          port: config.port || 5432,
          database: config.database,
          user: config.user,
          password: config.password,
          max: 10
        };

    const pool = new Pool(poolConfig);

    // Verify the connection works
    const client = await pool.connect();
    client.release();

    this.connections.set(connectionId, pool);
    logger.info(`PostgreSQL connected: ${config.connectionString || config.host} (${connectionId})`);
    return connectionId;
  }

  async disconnect(connectionId) {
    const pool = this._getPool(connectionId);
    await pool.end();
    this.connections.delete(connectionId);
    logger.info(`PostgreSQL disconnected: ${connectionId}`);
  }

  async testConnection(config) {
    let pool;
    try {
      const poolConfig = config.connectionString
        ? { connectionString: config.connectionString, max: 1 }
        : {
            host: config.host,
            port: config.port || 5432,
            database: config.database,
            user: config.user,
            password: config.password,
            max: 1
          };

      pool = new Pool(poolConfig);
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      if (pool) await pool.end();
    }
  }

  /**
   * Re-establish a live pg.Pool for an already-persisted connection ID.
   * Used on server startup to restore pools without issuing new UUIDs.
   */
  async reconnectFromConfig(connectionId, config) {
    const poolConfig = config.connectionString
      ? { connectionString: config.connectionString, max: 10 }
      : {
          host: config.host,
          port: config.port || 5432,
          database: config.database,
          user: config.user,
          password: config.password,
          max: 10
        };

    const pool = new Pool(poolConfig);
    const client = await pool.connect();
    client.release();
    this.connections.set(connectionId, pool);
    logger.info(`PostgreSQL auto-reconnected: ${config.connectionString || config.host} (${connectionId})`);
  }

  // --- Explorer ---

  async listTables(connectionId) {
    const pool = this._getPool(connectionId);
    const result = await pool.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
       ORDER BY table_name`
    );
    return result.rows.map((r) => r.table_name);
  }

  async getViews(connectionId) {
    const pool = this._getPool(connectionId);
    const result = await pool.query(
      `SELECT table_name FROM information_schema.views
       WHERE table_schema = 'public'
       ORDER BY table_name`
    );
    return result.rows.map((r) => r.table_name);
  }

  async getIndexes(connectionId, tableName) {
    const pool = this._getPool(connectionId);
    const result = await pool.query(
      `SELECT indexname, indexdef FROM pg_indexes
       WHERE schemaname = 'public' AND tablename = $1
       ORDER BY indexname`,
      [tableName]
    );
    return result.rows.map((r) => ({
      name: r.indexname,
      definition: r.indexdef
    }));
  }

  // --- Schema ---

  async getTableSchema(connectionId, tableName) {
    const pool = this._getPool(connectionId);

    const columnsResult = await pool.query(
      `SELECT column_name, data_type, is_nullable, column_default,
              character_maximum_length, numeric_precision
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = $1
       ORDER BY ordinal_position`,
      [tableName]
    );

    // Get primary key columns
    const pkResult = await pool.query(
      `SELECT kcu.column_name
       FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage kcu
         ON tc.constraint_name = kcu.constraint_name
         AND tc.table_schema = kcu.table_schema
       WHERE tc.constraint_type = 'PRIMARY KEY'
         AND tc.table_schema = 'public'
         AND tc.table_name = $1`,
      [tableName]
    );
    const pkColumns = new Set(pkResult.rows.map((r) => r.column_name));

    // Generate CREATE TABLE statement
    const createStatement = await this._generateCreateStatement(pool, tableName, columnsResult.rows, pkColumns);

    return {
      columns: columnsResult.rows.map((c) => ({
        name: c.column_name,
        type: c.data_type,
        nullable: c.is_nullable === 'YES',
        defaultValue: c.column_default,
        primaryKey: pkColumns.has(c.column_name),
        maxLength: c.character_maximum_length,
        precision: c.numeric_precision
      })),
      createStatement
    };
  }

  // --- CRUD ---

  async getRows(connectionId, tableName, options = {}) {
    const pool = this._getPool(connectionId);
    const { page = 1, limit = 50, sortBy, sortOrder = 'asc', filterColumn, filterValue } = options;
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params = [];
    let paramIndex = 1;

    if (filterColumn && filterValue !== undefined && filterValue !== '') {
      whereClause = `WHERE "${filterColumn}"::text ILIKE $${paramIndex}`;
      params.push(`%${filterValue}%`);
      paramIndex++;
    }

    const orderClause = sortBy
      ? `ORDER BY "${sortBy}" ${sortOrder === 'desc' ? 'DESC' : 'ASC'}`
      : '';

    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM "${tableName}" ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total, 10);

    const rowsResult = await pool.query(
      `SELECT * FROM "${tableName}" ${whereClause} ${orderClause} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return {
      rows: rowsResult.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async insertRow(connectionId, tableName, data) {
    const pool = this._getPool(connectionId);
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

    const result = await pool.query(
      `INSERT INTO "${tableName}" (${columns.map((c) => `"${c}"`).join(', ')}) VALUES (${placeholders}) RETURNING *`,
      values
    );

    return { inserted: result.rowCount, row: result.rows[0] };
  }

  async updateRow(connectionId, tableName, primaryKey, data) {
    const pool = this._getPool(connectionId);
    const pkCol = await this._getPrimaryKeyColumn(pool, tableName);

    const columns = Object.keys(data);
    const values = Object.values(data);
    const setClauses = columns.map((c, i) => `"${c}" = $${i + 1}`).join(', ');
    values.push(primaryKey);

    const result = await pool.query(
      `UPDATE "${tableName}" SET ${setClauses} WHERE "${pkCol}" = $${values.length} RETURNING *`,
      values
    );

    return { updated: result.rowCount, row: result.rows[0] };
  }

  async deleteRows(connectionId, tableName, primaryKeys) {
    const pool = this._getPool(connectionId);
    const pkCol = await this._getPrimaryKeyColumn(pool, tableName);
    const placeholders = primaryKeys.map((_, i) => `$${i + 1}`).join(', ');

    const result = await pool.query(
      `DELETE FROM "${tableName}" WHERE "${pkCol}" IN (${placeholders})`,
      primaryKeys
    );

    return { deleted: result.rowCount };
  }

  // --- Query execution ---

  async executeQuery(connectionId, queryText) {
    const pool = this._getPool(connectionId);
    const trimmed = queryText.trim();
    const isRead = /^(SELECT|EXPLAIN|WITH|SHOW)\b/i.test(trimmed);

    const result = await pool.query(trimmed);

    if (isRead) {
      return { type: 'read', rows: result.rows, rowCount: result.rowCount };
    }

    return { type: 'write', changes: result.rowCount };
  }

  // --- Import / Export ---

  async exportTable(connectionId, tableName, format) {
    const pool = this._getPool(connectionId);
    const result = await pool.query(`SELECT * FROM "${tableName}"`);
    const rows = result.rows;

    if (format === 'json') {
      return { data: JSON.stringify(rows, null, 2), contentType: 'application/json' };
    }

    if (format === 'csv') {
      if (rows.length === 0) return { data: '', contentType: 'text/csv' };
      const headers = Object.keys(rows[0]);
      const csvLines = [
        headers.join(','),
        ...rows.map((row) =>
          headers.map((h) => {
            const val = row[h] === null ? '' : String(row[h]);
            return val.includes(',') || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val;
          }).join(',')
        )
      ];
      return { data: csvLines.join('\n'), contentType: 'text/csv' };
    }

    if (format === 'sql') {
      const schema = await this.getTableSchema(connectionId, tableName);
      let dump = schema.createStatement ? schema.createStatement + ';\n\n' : '';
      for (const row of rows) {
        const cols = Object.keys(row).map((c) => `"${c}"`).join(', ');
        const vals = Object.values(row).map((v) =>
          v === null ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`
        ).join(', ');
        dump += `INSERT INTO "${tableName}" (${cols}) VALUES (${vals});\n`;
      }
      return { data: dump, contentType: 'application/sql' };
    }

    throw new Error(`Unsupported export format: ${format}`);
  }

  async importData(connectionId, tableName, records) {
    const pool = this._getPool(connectionId);
    if (!records || records.length === 0) {
      return { imported: 0 };
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const columns = Object.keys(records[0]);
      const colList = columns.map((c) => `"${c}"`).join(', ');
      let importedCount = 0;

      for (const record of records) {
        const values = columns.map((c) => record[c] ?? null);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
        await client.query(`INSERT INTO "${tableName}" (${colList}) VALUES (${placeholders})`, values);
        importedCount++;
      }

      await client.query('COMMIT');
      return { imported: importedCount };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // --- Private helpers ---

  _getPool(connectionId) {
    const pool = this.connections.get(connectionId);
    if (!pool) {
      throw new Error(`No active PostgreSQL connection with id: ${connectionId}`);
    }
    return pool;
  }

  async _getPrimaryKeyColumn(pool, tableName) {
    const result = await pool.query(
      `SELECT kcu.column_name
       FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage kcu
         ON tc.constraint_name = kcu.constraint_name
         AND tc.table_schema = kcu.table_schema
       WHERE tc.constraint_type = 'PRIMARY KEY'
         AND tc.table_schema = 'public'
         AND tc.table_name = $1
       LIMIT 1`,
      [tableName]
    );

    if (result.rows.length === 0) {
      throw new Error(`Table "${tableName}" has no primary key column. Cannot identify rows.`);
    }
    return result.rows[0].column_name;
  }

  async _generateCreateStatement(pool, tableName, columns, pkColumns) {
    const colDefs = columns.map((c) => {
      let def = `  "${c.column_name}" ${c.data_type}`;
      if (c.character_maximum_length) def += `(${c.character_maximum_length})`;
      if (c.is_nullable === 'NO') def += ' NOT NULL';
      if (c.column_default) def += ` DEFAULT ${c.column_default}`;
      return def;
    });

    const pkCols = Array.from(pkColumns);
    if (pkCols.length > 0) {
      colDefs.push(`  PRIMARY KEY (${pkCols.map((c) => `"${c}"`).join(', ')})`);
    }

    return `CREATE TABLE "${tableName}" (\n${colDefs.join(',\n')}\n)`;
  }
}
