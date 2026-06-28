import { getProvider } from '../providers/providerRegistry.js';
import { encrypt, decrypt } from '../utils/crypto.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../config/logger.js';
import { connectionStore } from './connectionStore.js';

/**
 * On server startup, restore live database clients for every connection
 * that was persisted to disk. Failures are logged as warnings rather than
 * crashing the server — a database may simply be unavailable at boot time.
 */
export async function initConnections() {
  const entries = Array.from(connectionStore.entries());
  if (entries.length === 0) return;

  logger.info(`Restoring ${entries.length} persisted connection(s)...`);

  await Promise.allSettled(
    entries.map(async ([id, entry]) => {
      try {
        const provider = _resolveProvider(entry.type);
        const config = _decryptConfig(entry.config, entry.type);
        await provider.reconnectFromConfig(id, config);
      } catch (err) {
        logger.warn(`Could not auto-reconnect ${entry.name} (${id}): ${err.message}`);
      }
    })
  );
}

/**
 * Create and open a new database connection.
 */
export async function createConnection(params) {
  const provider = _resolveProvider(params.type);
  const connectionId = await provider.connect(params);

  const entry = {
    id: connectionId,
    name: params.name,
    type: params.type,
    favorite: false,
    createdAt: new Date().toISOString(),
    config: _encryptSensitiveFields(params)
  };

  connectionStore.set(connectionId, entry);
  logger.info(`Connection created: ${entry.name} (${connectionId})`);

  return _sanitizeConnection(entry);
}

/**
 * List all saved connections (passwords masked).
 */
export async function listConnections() {
  return Array.from(connectionStore.values()).map(_sanitizeConnection);
}

/**
 * Get a single connection by id (passwords masked).
 */
export async function getConnection(id) {
  const entry = connectionStore.get(id);
  if (!entry) throw AppError.notFound(`Connection not found: ${id}`);
  return _sanitizeConnection(entry);
}

/**
 * Update an existing connection's metadata or credentials.
 */
export async function updateConnection(id, params) {
  const entry = connectionStore.get(id);
  if (!entry) throw AppError.notFound(`Connection not found: ${id}`);

  // If connection params changed, reconnect
  if (params.type || params.host || params.connectionString || params.uri || params.filePath) {
    const provider = _resolveProvider(entry.type);
    try {
      await provider.disconnect(id);
    } catch {
      // Ignore disconnect errors on reconnect
    }

    const newConfig = { ...(_decryptConfig(entry.config, entry.type)), ...params };
    await provider.connect(newConfig);
    entry.config = _encryptSensitiveFields(newConfig);
  }

  if (params.name) entry.name = params.name;
  entry.updatedAt = new Date().toISOString();

  connectionStore.set(id, entry);
  return _sanitizeConnection(entry);
}

/**
 * Delete a connection and disconnect.
 */
export async function deleteConnection(id) {
  const entry = connectionStore.get(id);
  if (!entry) throw AppError.notFound(`Connection not found: ${id}`);

  const provider = _resolveProvider(entry.type);
  try {
    await provider.disconnect(id);
  } catch (err) {
    logger.warn(`Error disconnecting ${id}: ${err.message}`);
  }

  connectionStore.delete(id);
  logger.info(`Connection deleted: ${id}`);
}

/**
 * Test a connection without saving it.
 */
export async function testConnection(params) {
  const provider = _resolveProvider(params.type);
  return provider.testConnection(params);
}

/**
 * Reconnect an existing connection.
 */
export async function reconnect(id) {
  const entry = connectionStore.get(id);
  if (!entry) throw AppError.notFound(`Connection not found: ${id}`);

  const provider = _resolveProvider(entry.type);

  try {
    await provider.disconnect(id);
  } catch {
    // Ignore disconnect errors
  }

  const config = _decryptConfig(entry.config, entry.type);
  const newConnectionId = await provider.connect(config);

  // Re-map with new connection id
  connectionStore.delete(id);
  entry.id = newConnectionId;
  entry.updatedAt = new Date().toISOString();
  connectionStore.set(newConnectionId, entry);

  logger.info(`Reconnected: ${entry.name} (${newConnectionId})`);
  return _sanitizeConnection(entry);
}

/**
 * Toggle favorite status.
 */
export async function toggleFavorite(id) {
  const entry = connectionStore.get(id);
  if (!entry) throw AppError.notFound(`Connection not found: ${id}`);

  entry.favorite = !entry.favorite;
  connectionStore.set(id, entry);
  return _sanitizeConnection(entry);
}

/**
 * Internal: resolve a provider instance from a saved connection id.
 * Exported so other services can look up the provider for a given connection.
 */
export function resolveProviderForConnection(connectionId) {
  const entry = connectionStore.get(connectionId);
  if (!entry) throw AppError.notFound(`Connection not found: ${connectionId}`);
  return _resolveProvider(entry.type);
}

// --- Private helpers ---

function _resolveProvider(type) {
  const provider = getProvider(type);
  if (!provider) throw AppError.badRequest(`Unsupported provider type: ${type}`);
  return provider;
}

function _encryptSensitiveFields(params) {
  const safe = { ...params };
  if (safe.password) safe.password = encrypt(safe.password);
  if (safe.connectionString) safe.connectionString = encrypt(safe.connectionString);
  if (safe.uri) safe.uri = encrypt(safe.uri);
  return safe;
}

function _decryptConfig(config, type) {
  const decrypted = { ...config };
  if (decrypted.password) decrypted.password = decrypt(decrypted.password);
  if (decrypted.connectionString) decrypted.connectionString = decrypt(decrypted.connectionString);
  if (decrypted.uri) decrypted.uri = decrypt(decrypted.uri);
  return decrypted;
}

function _sanitizeConnection(entry) {
  const { config, ...rest } = entry;
  // Build a safe config representation without sensitive fields
  const safeConfig = { ...config };
  delete safeConfig.password;
  delete safeConfig.connectionString;
  delete safeConfig.uri;

  return {
    ...rest,
    config: {
      ...safeConfig,
      // Indicate that credentials are present but hidden
      hasPassword: !!config.password,
      hasConnectionString: !!config.connectionString,
      hasUri: !!config.uri
    }
  };
}

