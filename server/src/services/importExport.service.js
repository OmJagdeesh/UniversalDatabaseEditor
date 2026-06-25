import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'csv-parse/sync';
import { resolveProviderForConnection } from './connection.service.js';
import { AppError } from '../utils/AppError.js';

/**
 * Export a table/collection in the specified format (csv, json, sql).
 */
export async function exportTable(connectionId, tableName, format) {
  const provider = resolveProviderForConnection(connectionId);
  return provider.exportTable(connectionId, tableName, format);
}

/**
 * Import data from a file or JSON body into a table/collection.
 *
 * @param {string} connectionId
 * @param {string} tableName
 * @param {object} options - { format, data?, filePath? }
 *   - data: array of records (for JSON body import)
 *   - filePath: path to uploaded file (for file import)
 */
export async function importData(connectionId, tableName, options) {
  const { format, data, filePath } = options;
  let records;

  if (data) {
    // Data provided directly in request body
    records = Array.isArray(data) ? data : [data];
  } else if (filePath) {
    // Data provided via uploaded file
    const content = fs.readFileSync(filePath, 'utf-8');

    if (format === 'json') {
      const parsed = JSON.parse(content);
      records = Array.isArray(parsed) ? parsed : [parsed];
    } else if (format === 'csv') {
      records = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });
    } else {
      throw AppError.badRequest(`Unsupported import format: ${format}`);
    }

    // Clean up the uploaded temp file
    try {
      fs.unlinkSync(filePath);
    } catch {
      // Non-critical if cleanup fails
    }
  } else {
    throw AppError.badRequest('Import requires either a data payload or an uploaded file.');
  }

  if (!records || records.length === 0) {
    throw AppError.badRequest('No records found to import.');
  }

  const provider = resolveProviderForConnection(connectionId);
  return provider.importData(connectionId, tableName, records);
}
