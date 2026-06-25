import { getTableSchema } from '../services/schema.service.js';
import { validateTableName } from '../utils/validation.js';

export async function getSchema(req, res) {
  const { id, table } = req.params;
  validateTableName(table);

  const schema = await getTableSchema(id, table);
  res.status(200).json({ data: schema });
}
