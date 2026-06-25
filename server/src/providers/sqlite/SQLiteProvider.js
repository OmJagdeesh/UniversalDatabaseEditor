import Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import { DatabaseProvider } from '../base/DatabaseProvider.js';
import { PROVIDER_TYPES } from '../../constants/providerTypes.js';
import { logger } from '../../config/logger.js';

export class SQLiteProvider extends DatabaseProvider {
  constructor() {
    super({
      type: PROVIDER_TYPES.SQLITE,
      displayName: 'SQLite',
      capabilities: {
        fileBased: true,
        connectionString: false,
        schemas: true,
        collections: false,
        sql: true
      }
    });

    /** @type {Map<string, Database>} */
    this.connections = new Map();
  }

  // --- Connection lifecycle ---

  async connect(config) {
    const { filePath } = config;
    const connectionId = randomUUID();
    const db = new Database(filePath, { fileMustExist: false });

    // Enable WAL mode for better concurrent performance
    db.pragma('journal_mode = WAL');
    this.connections.set(connectionId, db);
    logger.info(`SQLite connected: ${filePath} (${connectionId})`);
    return connectionId;
  }

  async disconnect(connectionId) {
    const db = this._getDb(connectionId);
    db.close();
    this.connections.delete(connectionId);
    logger.info(`SQLite disconnected: ${connectionId}`);
  }

  async testConnection(config) {
    const { filePath } = config;
    let db;
    try {
      db = new Database(filePath, { readonly: true, fileMustExist: true });
      db.prepare('SELECT 1').get();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      if (db) db.close();
    }
  }

  // --- Explorer ---

  async listTables(connectionId) {
    const db = this._getDb(connectionId);
    const rows = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
      .all();
    return rows.map((r) => r.name);
  }

  async getViews(connectionId) {
    const db = this._getDb(connectionId);
    const rows = db
      .prepare("SELECT name FROM sqlite_master WHERE type='view' ORDER BY name")
      .all();
    return rows.map((r) => r.name);
  }

  async getIndexes(connectionId, tableName) {
    const db = this._getDb(connectionId);
    const rows = db.prepare(`PRAGMA index_list("${tableName}")`).all();
    return rows.map((r) => ({
      name: r.name,
      unique: r.unique === 1,
      origin: r.origin
    }));
  }

  // --- Schema ---

  async getTableSchema(connectionId, tableName) {
    const db = this._getDb(connectionId);
    const columns = db.prepare(`PRAGMA table_info("${tableName}")`).all();
    const createStmt = db
      .prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name = ?")
      .get(tableName);

    return {
      columns: columns.map((c) => ({
        name: c.name,
        type: c.type,
        nullable: c.notnull === 0,
        defaultValue: c.dflt_value,
        primaryKey: c.pk === 1
      })),
      createStatement: createStmt ? createStmt.sql : null
    };
  }

  // --- CRUD ---

  async getRows(connectionId, tableName, options = {}) {
    const db = this._getDb(connectionId);
    const { page = 1, limit = 50, sortBy, sortOrder = 'asc', filterColumn, filterValue } = options;
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params = [];
    if (filterColumn && filterValue !== undefined && filterValue !== '') {
      whereClause = `WHERE "${filterColumn}" LIKE ?`;
      params.push(`%${filterValue}%`);
    }

    const orderClause = sortBy ? `ORDER BY "${sortBy}" ${sortOrder === 'desc' ? 'DESC' : 'ASC'}` : '';

    const countRow = db
      .prepare(`SELECT COUNT(*) as total FROM "${tableName}" ${whereClause}`)
      .get(...params);

    const rows = db
      .prepare(`SELECT * FROM "${tableName}" ${whereClause} ${orderClause} LIMIT ? OFFSET ?`)
      .all(...params, limit, offset);

    return {
      rows,
      total: countRow.total,
      page,
      limit,
      totalPages: Math.ceil(countRow.total / limit)
    };
  }

  async insertRow(connectionId, tableName, data) {
    const db = this._getDb(connectionId);
    const columns = Object.keys(data);
    const placeholders = columns.map(() => '?').join(', ');
    const values = Object.values(data);

    const stmt = db.prepare(
      `INSERT INTO "${tableName}" (${columns.map((c) => `"${c}"`).join(', ')}) VALUES (${placeholders})`
    );
    const result = stmt.run(...values);

    return { inserted: result.changes, lastInsertRowid: Number(result.lastInsertRowid) };
  }

  async updateRow(connectionId, tableName, primaryKey, data) {
    const db = this._getDb(connectionId);

    // Determine primary key column from schema
    const pkCol = await this._getPrimaryKeyColumn(db, tableName);
    const setClauses = Object.keys(data).map((c) => `"${c}" = ?`);
    const values = [...Object.values(data), primaryKey];

    const stmt = db.prepare(
      `UPDATE "${tableName}" SET ${setClauses.join(', ')} WHERE "${pkCol}" = ?`
    );
    const result = stmt.run(...values);

    return { updated: result.changes };
  }

  async deleteRows(connectionId, tableName, primaryKeys) {
    const db = this._getDb(connectionId);
    const pkCol = await this._getPrimaryKeyColumn(db, tableName);
    const placeholders = primaryKeys.map(() => '?').join(', ');

    const stmt = db.prepare(
      `DELETE FROM "${tableName}" WHERE "${pkCol}" IN (${placeholders})`
    );
    const result = stmt.run(...primaryKeys);

    return { deleted: result.changes };
  }

  // --- Query execution ---

  async executeQuery(connectionId, queryText) {
    const db = this._getDb(connectionId);
    const trimmed = queryText.trim();

    // Determine if query is a SELECT / PRAGMA (read) or a write operation
    const isRead = /^(SELECT|PRAGMA|EXPLAIN|WITH)\b/i.test(trimmed);

    if (isRead) {
      const rows = db.prepare(trimmed).all();
      return { type: 'read', rows, rowCount: rows.length };
    }

    const result = db.prepare(trimmed).run();
    return { type: 'write', changes: result.changes };
  }

  // --- Import / Export ---

  async exportTable(connectionId, tableName, format) {
    const db = this._getDb(connectionId);
    const rows = db.prepare(`SELECT * FROM "${tableName}"`).all();

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
            // Escape values containing commas or quotes
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
        const vals = Object.values(row).map((v) => (v === null ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`)).join(', ');
        dump += `INSERT INTO "${tableName}" (${cols}) VALUES (${vals});\n`;
      }
      return { data: dump, contentType: 'application/sql' };
    }

    throw new Error(`Unsupported export format: ${format}`);
  }

  async importData(connectionId, tableName, records) {
    const db = this._getDb(connectionId);
    if (!records || records.length === 0) {
      return { imported: 0 };
    }

    const columns = Object.keys(records[0]);
    const placeholders = columns.map(() => '?').join(', ');
    const stmt = db.prepare(
      `INSERT INTO "${tableName}" (${columns.map((c) => `"${c}"`).join(', ')}) VALUES (${placeholders})`
    );

    const insertMany = db.transaction((rows) => {
      let count = 0;
      for (const row of rows) {
        stmt.run(...columns.map((c) => row[c] ?? null));
        count++;
      }
      return count;
    });

    const imported = insertMany(records);
    return { imported };
  }

  // --- Private helpers ---

  _getDb(connectionId) {
    const db = this.connections.get(connectionId);
    if (!db) {
      throw new Error(`No active SQLite connection with id: ${connectionId}`);
    }
    return db;
  }

  async _getPrimaryKeyColumn(db, tableName) {
    const columns = db.prepare(`PRAGMA table_info("${tableName}")`).all();
    const pkCol = columns.find((c) => c.pk === 1);
    if (!pkCol) {
      throw new Error(`Table "${tableName}" has no primary key column. Cannot identify rows.`);
    }
    return pkCol.name;
  }
}
