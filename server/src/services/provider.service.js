import { listProviderMetadata } from '../providers/providerRegistry.js';

export async function getAvailableProviders() {
  return listProviderMetadata();
}
