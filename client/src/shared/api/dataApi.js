import { apiRequest } from './httpClient.js';

function rowsBase(connectionId, table) {
  return `/api/connections/${connectionId}/tables/${encodeURIComponent(table)}/rows`;
}

/**
 * Fetch paginated rows with optional sorting and filtering.
 * @param {object} params - { page, limit, sortBy, sortOrder, filterColumn, filterValue }
 */
export function fetchRows(connectionId, table, params = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page);
  if (params.limit) query.set('limit', params.limit);
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.sortOrder) query.set('sortOrder', params.sortOrder);
  if (params.filterColumn) query.set('filterColumn', params.filterColumn);
  if (params.filterValue) query.set('filterValue', params.filterValue);

  const qs = query.toString();
  return apiRequest(`${rowsBase(connectionId, table)}${qs ? `?${qs}` : ''}`);
}

export function insertRow(connectionId, table, data) {
  return apiRequest(rowsBase(connectionId, table), {
    method: 'POST',
    body: JSON.stringify({ data })
  });
}

export function updateRow(connectionId, table, pk, data) {
  return apiRequest(`${rowsBase(connectionId, table)}/${encodeURIComponent(pk)}`, {
    method: 'PUT',
    body: JSON.stringify({ data })
  });
}

export function deleteRows(connectionId, table, primaryKeys) {
  return apiRequest(rowsBase(connectionId, table), {
    method: 'DELETE',
    body: JSON.stringify({ primaryKeys })
  });
}
