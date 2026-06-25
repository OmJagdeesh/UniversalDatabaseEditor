import { PROVIDER_TYPES } from '../constants/providerTypes.js';
import { MongoProvider } from './mongo/MongoProvider.js';
import { PostgreSQLProvider } from './postgres/PostgreSQLProvider.js';
import { SQLiteProvider } from './sqlite/SQLiteProvider.js';

const providers = new Map([
  [PROVIDER_TYPES.SQLITE, new SQLiteProvider()],
  [PROVIDER_TYPES.POSTGRESQL, new PostgreSQLProvider()],
  [PROVIDER_TYPES.MONGODB, new MongoProvider()]
]);

export function listProviderMetadata() {
  return Array.from(providers.values()).map((provider) => provider.getMetadata());
}

export function getProvider(providerType) {
  return providers.get(providerType);
}

export function registerProvider(provider) {
  if (providers.has(provider.type)) {
    throw new Error(`Provider already registered: ${provider.type}`);
  }

  providers.set(provider.type, provider);
}
