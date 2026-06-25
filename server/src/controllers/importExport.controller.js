import * as importExportService from '../services/importExport.service.js';
import { exportSchema } from '../utils/validation.js';
import { validateTableName } from '../utils/validation.js';
import { AppError } from '../utils/AppError.js';

export async function exportTable(req, res) {
  const { id, table } = req.params;
  validateTableName(table);

  const { format } = exportSchema.parse(req.query);
  const result = await importExportService.exportTable(id, table, format);

  // Set proper headers for file download
  const extensions = { csv: 'csv', json: 'json', sql: 'sql' };
  res.setHeader('Content-Type', result.contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${table}.${extensions[format]}"`);
  res.status(200).send(result.data);
}

export async function importTable(req, res) {
  const { id, table } = req.params;
  validateTableName(table);

  const format = req.body.format || (req.file ? req.file.originalname.split('.').pop() : null);
  if (!format || !['csv', 'json'].includes(format)) {
    throw AppError.badRequest('Import format must be csv or json.');
  }

  const options = {
    format,
    data: req.body.data,
    filePath: req.file ? req.file.path : undefined
  };

  const result = await importExportService.importData(id, table, options);
  res.status(200).json({ data: result });
}
