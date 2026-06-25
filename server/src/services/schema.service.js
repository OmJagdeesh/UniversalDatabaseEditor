import { resolveProviderForConnection } from './connection.service.js';

/**
 * Get the schema (columns, types, constraints) for a table/collection.
 */
export async function getTableSchema(connectionId, tableName) {
  const provider = resolveProviderForConnection(connectionId);
  return provider.getTableSchema(connectionId, tableName);
}
