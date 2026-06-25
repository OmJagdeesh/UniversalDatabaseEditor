import { getAvailableProviders } from '../services/provider.service.js';

export async function listProviders(req, res) {
  const providers = await getAvailableProviders();

  res.status(200).json({
    data: providers
  });
}
