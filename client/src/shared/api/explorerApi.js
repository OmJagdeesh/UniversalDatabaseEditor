import { apiRequest } from './httpClient.js';

export function fetchExplorerTree(connectionId) {
  return apiRequest(`/api/connections/${connectionId}/explorer`);
}
