import { getHealthStatus } from '../services/health.service.js';

export async function getHealth(req, res) {
  const health = await getHealthStatus();

  res.status(200).json({
    data: health
  });
}
