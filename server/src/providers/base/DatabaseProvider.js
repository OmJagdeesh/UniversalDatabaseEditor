/**
 * Abstract base class for all database providers.
 * Each concrete provider (SQLite, PostgreSQL, MongoDB) must implement
 * every method defined here. This enables the plugin architecture so
 * new databases can be added by implementing a single provider class.
 */
export class DatabaseProvider {
  constructor({ type, displayName, capabilities }) {
    if (!type || !displayName) {
      throw new Error('Database providers require a type and displayName.');
    }

    this.type = type;
    this.displayName = displayName;
    this.capabilities = capabilities;
  }

  getMetadata() {
    return {
      type: this.type,
      displayName: this.displayName,
      capabilities: this.capabilities
    };
  }

  // --- Connection lifecycle ---

  async connect(/* config */) {
    throw new Error(`${this.displayName} connect() is not implemented yet.`);
  }

  async disconnect(/* connectionId */) {
    throw new Error(`${this.displayName} disconnect() is not implemented yet.`);
  }

  async testConnection(/* config */) {
    throw new Error(`${this.displayName} testConnection() is not implemented yet.`);
  }

  // --- Explorer ---

  async listTables(/* connectionId */) {
    throw new Error(`${this.displayName} listTables() is not implemented yet.`);
  }

  async getViews(/* connectionId */) {
    throw new Error(`${this.displayName} getViews() is not implemented yet.`);
  }

  async getIndexes(/* connectionId, tableName */) {
    throw new Error(`${this.displayName} getIndexes() is not implemented yet.`);
  }

  // --- Schema ---

  async getTableSchema(/* connectionId, tableName */) {
    throw new Error(`${this.displayName} getTableSchema() is not implemented yet.`);
  }

  // --- CRUD ---

  async getRows(/* connectionId, tableName, options */) {
    throw new Error(`${this.displayName} getRows() is not implemented yet.`);
  }

  async insertRow(/* connectionId, tableName, data */) {
    throw new Error(`${this.displayName} insertRow() is not implemented yet.`);
  }

  async updateRow(/* connectionId, tableName, primaryKey, data */) {
    throw new Error(`${this.displayName} updateRow() is not implemented yet.`);
  }

  async deleteRows(/* connectionId, tableName, primaryKeys */) {
    throw new Error(`${this.displayName} deleteRows() is not implemented yet.`);
  }

  // --- Query execution ---

  async executeQuery(/* connectionId, queryText */) {
    throw new Error(`${this.displayName} executeQuery() is not implemented yet.`);
  }

  // --- Import / Export ---

  async exportTable(/* connectionId, tableName, format */) {
    throw new Error(`${this.displayName} exportTable() is not implemented yet.`);
  }

  async importData(/* connectionId, tableName, records */) {
    throw new Error(`${this.displayName} importData() is not implemented yet.`);
  }
}
