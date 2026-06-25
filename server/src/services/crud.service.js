import { resolveProviderForConnection } from './connection.service.js';

/**
 * Get paginated, sorted, and filtered rows from a table/collection.
 */
export async function getRows(connectionId, tableName, options) {
  const provider = resolveProviderForConnection(connectionId);
  return provider.getRows(connectionId, tableName, options);
}

/**
 * Insert a new row/document.
 */
export async function insertRow(connectionId, tableName, data) {
  const provider = resolveProviderForConnection(connectionId);
  return provider.insertRow(connectionId, tableName, data);
}

/**
 * Update an existing row/document by primary key.
 */
export async function updateRow(connectionId, tableName, primaryKey, data) {
  const provider = resolveProviderForConnection(connectionId);
  return provider.updateRow(connectionId, tableName, primaryKey, data);
}

/**
 * Delete one or more rows/documents by primary keys.
 */
export async function deleteRows(connectionId, tableName, primaryKeys) {
  const provider = resolveProviderForConnection(connectionId);
  return provider.deleteRows(connectionId, tableName, primaryKeys);
}
