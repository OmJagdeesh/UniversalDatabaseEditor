import * as crudService from '../services/crud.service.js';
import { getRowsSchema, insertRowSchema, updateRowSchema, deleteRowsSchema } from '../utils/validation.js';
import { validateTableName } from '../utils/validation.js';

export async function getRows(req, res) {
  const { id, table } = req.params;
  validateTableName(table);

  const options = getRowsSchema.parse(req.query);
  const result = await crudService.getRows(id, table, options);
  res.status(200).json({ data: result });
}

export async function insertRow(req, res) {
  const { id, table } = req.params;
  validateTableName(table);

  const { data } = insertRowSchema.parse(req.body);
  const result = await crudService.insertRow(id, table, data);
  res.status(201).json({ data: result });
}

export async function updateRow(req, res) {
  const { id, table, pk } = req.params;
  validateTableName(table);

  const { data } = updateRowSchema.parse(req.body);
  const result = await crudService.updateRow(id, table, pk, data);
  res.status(200).json({ data: result });
}

export async function deleteRows(req, res) {
  const { id, table } = req.params;
  validateTableName(table);

  const { primaryKeys } = deleteRowsSchema.parse(req.body);
  const result = await crudService.deleteRows(id, table, primaryKeys);
  res.status(200).json({ data: result });
}
