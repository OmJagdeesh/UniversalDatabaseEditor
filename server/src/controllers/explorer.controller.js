import { getExplorerTree } from '../services/explorer.service.js';

export async function getTree(req, res) {
  const tree = await getExplorerTree(req.params.id);
  res.status(200).json({ data: tree });
}
