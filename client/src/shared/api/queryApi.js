import { apiRequest } from './httpClient.js';

/**
 * Execute a query against a connection.
 * The backend returns 409 if the query is dangerous and confirm is false.
 */
export async function executeQuery(connectionId, query, confirm = false) {
  try {
    return await apiRequest(`/api/connections/${connectionId}/query`, {
      method: 'POST',
      body: JSON.stringify({ query, confirm })
    });
  } catch (err) {
    // 409 = dangerous query warning — pass it through as a structured result
    if (err.status === 409 && err.payload?.requiresConfirmation) {
      return err.payload;
    }
    throw err;
  }
}
