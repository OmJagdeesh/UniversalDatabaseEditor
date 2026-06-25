import { resolveProviderForConnection } from './connection.service.js';
import { analyzeQuery } from '../utils/queryGuard.js';

/**
 * Execute a raw query against a connection.
 * If the query is dangerous and confirm is not true, returns a warning.
 */
export async function executeQuery(connectionId, queryText, confirm = false) {
  const provider = resolveProviderForConnection(connectionId);

  // For SQL providers, run the query guard
  if (provider.capabilities.sql) {
    const analysis = analyzeQuery(queryText);
    if (analysis.dangerous && !confirm) {
      return {
        requiresConfirmation: true,
        message: 'This query contains potentially dangerous operations. Set confirm: true to proceed.',
        patterns: analysis.patterns
      };
    }
  }

  return provider.executeQuery(connectionId, queryText);
}
