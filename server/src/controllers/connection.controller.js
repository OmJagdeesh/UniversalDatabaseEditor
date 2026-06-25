import {
  createConnection,
  listConnections,
  getConnection,
  updateConnection,
  deleteConnection,
  testConnection,
  reconnect,
  toggleFavorite
} from '../services/connection.service.js';
import { validateConnectionParams } from '../utils/validation.js';
import { AppError } from '../utils/AppError.js';

export async function create(req, res) {
  let params;
  // Handle file upload for SQLite
  if (req.file) {
    params = validateConnectionParams({
      ...req.body,
      filePath: req.file.path
    });
  } else {
    params = validateConnectionParams(req.body);
  }

  const connection = await createConnection(params);
  res.status(201).json({ data: connection });
}

export async function list(req, res) {
  const connections = await listConnections();
  res.status(200).json({ data: connections });
}

export async function get(req, res) {
  const connection = await getConnection(req.params.id);
  res.status(200).json({ data: connection });
}

export async function update(req, res) {
  const { id } = req.params;
  const connection = await updateConnection(id, req.body);
  res.status(200).json({ data: connection });
}

export async function remove(req, res) {
  await deleteConnection(req.params.id);
  res.status(204).end();
}

export async function test(req, res) {
  if (!req.body.type) {
    throw AppError.badRequest('Provider type is required for testing.');
  }
  const result = await testConnection(req.body);
  res.status(200).json({ data: result });
}

export async function reconnectConnection(req, res) {
  const connection = await reconnect(req.params.id);
  res.status(200).json({ data: connection });
}

export async function favorite(req, res) {
  const connection = await toggleFavorite(req.params.id);
  res.status(200).json({ data: connection });
}
