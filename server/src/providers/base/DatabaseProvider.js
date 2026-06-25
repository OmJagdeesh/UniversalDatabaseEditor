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

  async connect() {
    throw new Error(`${this.displayName} connect() is not implemented yet.`);
  }

  async disconnect() {
    throw new Error(`${this.displayName} disconnect() is not implemented yet.`);
  }

  async testConnection() {
    throw new Error(`${this.displayName} testConnection() is not implemented yet.`);
  }

  async inspectSchema() {
    throw new Error(`${this.displayName} inspectSchema() is not implemented yet.`);
  }

  async query() {
    throw new Error(`${this.displayName} query() is not implemented yet.`);
  }
}
