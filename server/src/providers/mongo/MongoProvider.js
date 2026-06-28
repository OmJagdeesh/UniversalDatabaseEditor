import { MongoClient, ObjectId } from 'mongodb';
import { randomUUID } from 'node:crypto';
import { DatabaseProvider } from '../base/DatabaseProvider.js';
import { PROVIDER_TYPES } from '../../constants/providerTypes.js';
import { logger } from '../../config/logger.js';

export class MongoProvider extends DatabaseProvider {
  constructor() {
    super({
      type: PROVIDER_TYPES.MONGODB,
      displayName: 'MongoDB',
      capabilities: {
        fileBased: false,
        connectionString: true,
        schemas: false,
        collections: true,
        sql: false
      }
    });

    /** @type {Map<string, { client: MongoClient, db: import('mongodb').Db }>} */
    this.connections = new Map();
  }

  // --- Connection lifecycle ---

  async connect(config) {
    const { uri, database } = config;
    const connectionId = randomUUID();
    const client = new MongoClient(uri);

    await client.connect();
    const db = client.db(database);

    // Verify connectivity
    await db.command({ ping: 1 });

    this.connections.set(connectionId, { client, db });
    logger.info(`MongoDB connected: ${database} (${connectionId})`);
    return connectionId;
  }

  async disconnect(connectionId) {
    const conn = this._getConn(connectionId);
    await conn.client.close();
    this.connections.delete(connectionId);
    logger.info(`MongoDB disconnected: ${connectionId}`);
  }

  async testConnection(config) {
    const { uri, database } = config;
    let client;
    try {
      client = new MongoClient(uri);
      await client.connect();
      const db = client.db(database);
      await db.command({ ping: 1 });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      if (client) await client.close();
    }
  }

  /**
   * Re-establish a live MongoClient for an already-persisted connection ID.
   * Used on server startup to restore clients without issuing new UUIDs.
   */
  async reconnectFromConfig(connectionId, config) {
    const { uri, database } = config;
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db(database);
    await db.command({ ping: 1 });
    this.connections.set(connectionId, { client, db });
    logger.info(`MongoDB auto-reconnected: ${database} (${connectionId})`);
  }

  // --- Explorer ---

  async listTables(connectionId) {
    const { db } = this._getConn(connectionId);
    const collections = await db.listCollections().toArray();
    return collections.map((c) => c.name).sort();
  }

  async getViews(connectionId) {
    const { db } = this._getConn(connectionId);
    const collections = await db.listCollections({ type: 'view' }).toArray();
    return collections.map((c) => c.name).sort();
  }

  async getIndexes(connectionId, tableName) {
    const { db } = this._getConn(connectionId);
    const indexes = await db.collection(tableName).indexes();
    return indexes.map((idx) => ({
      name: idx.name,
      keys: idx.key,
      unique: idx.unique || false
    }));
  }

  // --- Schema ---

  async getTableSchema(connectionId, tableName) {
    const { db } = this._getConn(connectionId);
    const collection = db.collection(tableName);

    // Sample documents to infer field types
    const sampleDocs = await collection.find().limit(100).toArray();
    const fieldMap = new Map();

    for (const doc of sampleDocs) {
      for (const [key, value] of Object.entries(doc)) {
        if (!fieldMap.has(key)) {
          fieldMap.set(key, typeof value);
        }
      }
    }

    const indexes = await collection.indexes();
    const stats = await collection.estimatedDocumentCount();

    return {
      columns: Array.from(fieldMap.entries()).map(([name, type]) => ({
        name,
        type,
        nullable: true,
        primaryKey: name === '_id'
      })),
      indexes,
      documentCount: stats,
      createStatement: null
    };
  }

  // --- CRUD ---

  async getRows(connectionId, tableName, options = {}) {
    const { db } = this._getConn(connectionId);
    const { page = 1, limit = 50, sortBy, sortOrder = 'asc', filterColumn, filterValue } = options;
    const skip = (page - 1) * limit;

    const filter = {};
    if (filterColumn && filterValue !== undefined && filterValue !== '') {
      // Case-insensitive regex search for text fields
      filter[filterColumn] = { $regex: filterValue, $options: 'i' };
    }

    const sort = {};
    if (sortBy) {
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    }

    const collection = db.collection(tableName);
    const total = await collection.countDocuments(filter);
    const rows = await collection.find(filter).sort(sort).skip(skip).limit(limit).toArray();

    // Convert ObjectId to string for JSON serialization
    const serializedRows = rows.map((row) => this._serializeDocument(row));

    return {
      rows: serializedRows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async insertRow(connectionId, tableName, data) {
    const { db } = this._getConn(connectionId);
    const result = await db.collection(tableName).insertOne(data);

    return { inserted: 1, insertedId: result.insertedId.toString() };
  }

  async updateRow(connectionId, tableName, primaryKey, data) {
    const { db } = this._getConn(connectionId);
    const objectId = this._toObjectId(primaryKey);

    // Remove _id from update data if present
    const updateData = { ...data };
    delete updateData._id;

    const result = await db.collection(tableName).updateOne(
      { _id: objectId },
      { $set: updateData }
    );

    return { updated: result.modifiedCount };
  }

  async deleteRows(connectionId, tableName, primaryKeys) {
    const { db } = this._getConn(connectionId);
    const objectIds = primaryKeys.map((pk) => this._toObjectId(pk));

    const result = await db.collection(tableName).deleteMany({
      _id: { $in: objectIds }
    });

    return { deleted: result.deletedCount };
  }

  // --- Query execution ---

  async executeQuery(connectionId, queryText) {
    const { db } = this._getConn(connectionId);
    const trimmed = queryText.trim();

    // Parse MongoDB-style query syntax: db.collection.method(args)
    const match = trimmed.match(/^db\.(\w+)\.(\w+)\(([\s\S]*)\)$/);
    if (!match) {
      throw new Error(
        'Invalid query syntax. Use format: db.collection.method({...}) ' +
        'Supported methods: find, aggregate, insertOne, insertMany, updateOne, updateMany, deleteOne, deleteMany, countDocuments'
      );
    }

    const [, collectionName, method, argsStr] = match;
    const collection = db.collection(collectionName);

    // Safely parse JSON arguments
    let args;
    try {
      args = argsStr.trim() ? JSON.parse(`[${argsStr}]`) : [];
    } catch {
      throw new Error(`Failed to parse query arguments. Ensure valid JSON: ${argsStr}`);
    }

    switch (method) {
      case 'find': {
        const [filter = {}, projection] = args;
        let cursor = collection.find(filter);
        if (projection) cursor = cursor.project(projection);
        const rows = await cursor.limit(1000).toArray();
        return { type: 'read', rows: rows.map((r) => this._serializeDocument(r)), rowCount: rows.length };
      }
      case 'aggregate': {
        const [pipeline = []] = args;
        const rows = await collection.aggregate(pipeline).toArray();
        return { type: 'read', rows: rows.map((r) => this._serializeDocument(r)), rowCount: rows.length };
      }
      case 'countDocuments': {
        const [filter = {}] = args;
        const count = await collection.countDocuments(filter);
        return { type: 'read', rows: [{ count }], rowCount: 1 };
      }
      case 'insertOne': {
        const [doc] = args;
        const result = await collection.insertOne(doc);
        return { type: 'write', changes: 1, insertedId: result.insertedId.toString() };
      }
      case 'insertMany': {
        const [docs] = args;
        const result = await collection.insertMany(docs);
        return { type: 'write', changes: result.insertedCount };
      }
      case 'updateOne': {
        const [filter, update] = args;
        const result = await collection.updateOne(filter, update);
        return { type: 'write', changes: result.modifiedCount };
      }
      case 'updateMany': {
        const [filter, update] = args;
        const result = await collection.updateMany(filter, update);
        return { type: 'write', changes: result.modifiedCount };
      }
      case 'deleteOne': {
        const [filter] = args;
        const result = await collection.deleteOne(filter);
        return { type: 'write', changes: result.deletedCount };
      }
      case 'deleteMany': {
        const [filter] = args;
        const result = await collection.deleteMany(filter);
        return { type: 'write', changes: result.deletedCount };
      }
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
  }

  // --- Import / Export ---

  async exportTable(connectionId, tableName, format) {
    const { db } = this._getConn(connectionId);
    const rows = await db.collection(tableName).find().toArray();
    const serialized = rows.map((r) => this._serializeDocument(r));

    if (format === 'json') {
      return { data: JSON.stringify(serialized, null, 2), contentType: 'application/json' };
    }

    if (format === 'csv') {
      if (serialized.length === 0) return { data: '', contentType: 'text/csv' };
      // Gather all unique keys from all documents
      const headerSet = new Set();
      for (const doc of serialized) {
        Object.keys(doc).forEach((k) => headerSet.add(k));
      }
      const headers = Array.from(headerSet);

      const csvLines = [
        headers.join(','),
        ...serialized.map((row) =>
          headers.map((h) => {
            const val = row[h] === undefined || row[h] === null ? '' : String(row[h]);
            return val.includes(',') || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val;
          }).join(',')
        )
      ];
      return { data: csvLines.join('\n'), contentType: 'text/csv' };
    }

    if (format === 'sql') {
      // MongoDB doesn't have SQL, but we can produce inserts as JSON documents
      throw new Error('SQL export is not supported for MongoDB. Use JSON or CSV format.');
    }

    throw new Error(`Unsupported export format: ${format}`);
  }

  async importData(connectionId, tableName, records) {
    const { db } = this._getConn(connectionId);
    if (!records || records.length === 0) {
      return { imported: 0 };
    }

    const result = await db.collection(tableName).insertMany(records);
    return { imported: result.insertedCount };
  }

  // --- Private helpers ---

  _getConn(connectionId) {
    const conn = this.connections.get(connectionId);
    if (!conn) {
      throw new Error(`No active MongoDB connection with id: ${connectionId}`);
    }
    return conn;
  }

  _toObjectId(value) {
    try {
      return new ObjectId(value);
    } catch {
      // If it's not a valid ObjectId, return as-is for non-default _id fields
      return value;
    }
  }

  _serializeDocument(doc) {
    const serialized = {};
    for (const [key, value] of Object.entries(doc)) {
      if (value instanceof ObjectId) {
        serialized[key] = value.toString();
      } else if (value instanceof Date) {
        serialized[key] = value.toISOString();
      } else if (typeof value === 'object' && value !== null) {
        serialized[key] = JSON.stringify(value);
      } else {
        serialized[key] = value;
      }
    }
    return serialized;
  }
}
