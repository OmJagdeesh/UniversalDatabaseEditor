import { apiRequest, apiUpload } from './httpClient.js';

const BASE = '/api/connections';

export function fetchConnections() {
  return apiRequest(BASE);
}

export function fetchConnection(id) {
  return apiRequest(`${BASE}/${id}`);
}

/**
 * Create a new connection.
 * For SQLite with file upload, pass a FormData instance.
 */
export function createConnection(data) {
  if (data instanceof FormData) {
    return apiUpload(BASE, data);
  }
  return apiRequest(BASE, { method: 'POST', body: JSON.stringify(data) });
}

export function updateConnection(id, data) {
  return apiRequest(`${BASE}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export function deleteConnection(id) {
  return apiRequest(`${BASE}/${id}`, { method: 'DELETE' });
}

export function testConnection(data) {
  return apiRequest(`${BASE}/test`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export function reconnectConnection(id) {
  return apiRequest(`${BASE}/${id}/reconnect`, { method: 'POST' });
}

export function toggleFavorite(id) {
  return apiRequest(`${BASE}/${id}/favorite`, { method: 'PATCH' });
}
