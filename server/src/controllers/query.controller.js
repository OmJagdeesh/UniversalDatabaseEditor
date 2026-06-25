import { executeQuery } from '../services/query.service.js';
import { executeQuerySchema } from '../utils/validation.js';

export async function execute(req, res) {
  const { id } = req.params;
  const { query, confirm } = executeQuerySchema.parse(req.body);

  const result = await executeQuery(id, query, confirm);

  // If query requires confirmation, return 409 so the client can prompt the user
  if (result.requiresConfirmation) {
    return res.status(409).json({
      message: result.message,
      patterns: result.patterns,
      requiresConfirmation: true
    });
  }

  res.status(200).json({ data: result });
}
