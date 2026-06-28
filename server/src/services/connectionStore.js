import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { logger } from '../config/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../../data');
const STORE_FILE = path.join(DATA_DIR, 'connections.json');

/**
 * File-backed persistent Map for saved connections.
 * The in-memory Map is the source of truth during runtime;
 * every mutation is synchronously flushed to disk so that
 * server restarts (e.g. node --watch) do not lose connection metadata.
 *
 * Sensitive fields (password, uri, connectionString) are stored
 * AES-encrypted exactly as they are in the in-memory version —
 * this module is intentionally unaware of encryption details.
 */
class ConnectionStore {
  constructor() {
    /** @type {Map<string, object>} */
    this._map = new Map();
    this._load();
  }

  // --- Map-compatible API ---

  get(id) {
    return this._map.get(id);
  }

  set(id, value) {
    this._map.set(id, value);
    this._flush();
    return this;
  }

  has(id) {
    return this._map.has(id);
  }

  delete(id) {
    const result = this._map.delete(id);
    if (result) this._flush();
    return result;
  }

  values() {
    return this._map.values();
  }

  entries() {
    return this._map.entries();
  }

  get size() {
    return this._map.size;
  }

  [Symbol.iterator]() {
    return this._map[Symbol.iterator]();
  }

  // --- Persistence ---

  _load() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (!fs.existsSync(STORE_FILE)) return;

      const raw = fs.readFileSync(STORE_FILE, 'utf8');
      const entries = JSON.parse(raw);
      for (const [id, entry] of entries) {
        this._map.set(id, entry);
      }
      logger.info(`ConnectionStore: loaded ${this._map.size} connection(s) from disk`);
    } catch (err) {
      logger.warn(`ConnectionStore: failed to load from disk — ${err.message}`);
    }
  }

  _flush() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const entries = Array.from(this._map.entries());
      fs.writeFileSync(STORE_FILE, JSON.stringify(entries, null, 2), 'utf8');
    } catch (err) {
      logger.warn(`ConnectionStore: failed to flush to disk — ${err.message}`);
    }
  }
}

// Singleton — one store for the lifetime of the server process
export const connectionStore = new ConnectionStore();
