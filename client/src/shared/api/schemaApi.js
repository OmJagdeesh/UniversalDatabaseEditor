import { apiRequest } from './httpClient.js';

export function fetchTableSchema(connectionId, table) {
  return apiRequest(
    `/api/connections/${connectionId}/tables/${encodeURIComponent(table)}/schema`
  );
}
