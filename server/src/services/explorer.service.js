import { resolveProviderForConnection } from './connection.service.js';

/**
 * Build the explorer tree for a given connection.
 * SQL databases return: tables, views, indexes.
 * MongoDB returns: collections.
 */
export async function getExplorerTree(connectionId) {
  const provider = resolveProviderForConnection(connectionId);

  const tables = await provider.listTables(connectionId);

  const tree = {
    tables
  };

  // SQL databases have views; MongoDB may return views from listCollections
  if (provider.capabilities.sql) {
    tree.views = await provider.getViews(connectionId);

    // Gather indexes per table
    const indexMap = {};
    for (const table of tables) {
      indexMap[table] = await provider.getIndexes(connectionId, table);
    }
    tree.indexes = indexMap;
  } else {
    // MongoDB: views are a separate type
    try {
      tree.views = await provider.getViews(connectionId);
    } catch {
      tree.views = [];
    }
  }

  return tree;
}
