const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(payload?.message || 'Request failed');
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

/**
 * Upload a file via multipart/form-data.
 * Do NOT set Content-Type header — the browser sets it with the boundary.
 */
export async function apiUpload(path, formData) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    body: formData
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(payload?.message || 'Upload failed');
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

/**
 * Download a file from the API. Returns a Blob.
 */
export async function apiDownload(path) {
  const response = await fetch(`${API_BASE_URL}${path}`);

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const error = new Error(payload?.message || 'Download failed');
    error.status = response.status;
    throw error;
  }

  const blob = await response.blob();
  const disposition = response.headers.get('Content-Disposition') || '';
  const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
  const filename = filenameMatch ? filenameMatch[1] : 'download';

  return { blob, filename };
}
