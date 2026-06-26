import { apiDownload, apiUpload } from './httpClient.js';

/**
 * Export a table in the specified format.
 * Triggers a file download in the browser.
 */
export async function exportTable(connectionId, table, format) {
  const path = `/api/connections/${connectionId}/tables/${encodeURIComponent(table)}/export?format=${format}`;
  const { blob, filename } = await apiDownload(path);

  // Trigger browser download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import data into a table from an uploaded file.
 */
export function importTable(connectionId, table, file, format) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('format', format);

  return apiUpload(
    `/api/connections/${connectionId}/tables/${encodeURIComponent(table)}/import`,
    formData
  );
}
