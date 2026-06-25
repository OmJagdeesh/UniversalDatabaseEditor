import { z } from 'zod';

// --- Connection parameter schemas ---

export const sqliteConnectionSchema = z.object({
  type: z.literal('sqlite'),
  name: z.string().min(1, 'Connection name is required'),
  filePath: z.string().min(1, 'File path is required').optional(),
  // filePath is optional when uploading via multer
}).refine(
  (data) => data.filePath,
  { message: 'Either filePath must be provided or a file must be uploaded' }
);

export const postgresConnectionSchema = z.object({
  type: z.literal('postgresql'),
  name: z.string().min(1, 'Connection name is required'),
  connectionString: z.string().optional(),
  host: z.string().optional(),
  port: z.coerce.number().int().positive().optional(),
  database: z.string().optional(),
  user: z.string().optional(),
  password: z.string().optional()
}).refine(
  (data) => data.connectionString || (data.host && data.database),
  { message: 'Provide either a connectionString or host + database' }
);

export const mongoConnectionSchema = z.object({
  type: z.literal('mongodb'),
  name: z.string().min(1, 'Connection name is required'),
  uri: z.string().min(1, 'MongoDB URI is required'),
  database: z.string().min(1, 'Database name is required')
});

// Dispatcher: validates based on `type` field
export function validateConnectionParams(body) {
  const { type } = body;
  switch (type) {
    case 'sqlite':
      return sqliteConnectionSchema.parse(body);
    case 'postgresql':
      return postgresConnectionSchema.parse(body);
    case 'mongodb':
      return mongoConnectionSchema.parse(body);
    default:
      throw new Error(`Unsupported provider type: ${type}`);
  }
}

// --- CRUD schemas ---

export const getRowsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(1000).default(50),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  filterColumn: z.string().optional(),
  filterValue: z.string().optional()
});

export const insertRowSchema = z.object({
  data: z.record(z.unknown()).refine(
    (obj) => Object.keys(obj).length > 0,
    { message: 'Record data must have at least one field' }
  )
});

export const updateRowSchema = z.object({
  data: z.record(z.unknown()).refine(
    (obj) => Object.keys(obj).length > 0,
    { message: 'Update data must have at least one field' }
  )
});

export const deleteRowsSchema = z.object({
  primaryKeys: z.array(z.unknown()).min(1, 'At least one primary key required')
});

// --- Query schema ---

export const executeQuerySchema = z.object({
  query: z.string().min(1, 'Query is required'),
  confirm: z.boolean().default(false)
});

// --- Import / Export schemas ---

export const exportSchema = z.object({
  format: z.enum(['csv', 'json', 'sql'])
});

export const importSchema = z.object({
  format: z.enum(['csv', 'json']),
  data: z.unknown()
});

// --- Table name validation ---

const TABLE_NAME_REGEX = /^[a-zA-Z_][a-zA-Z0-9_.]*$/;

export function validateTableName(name) {
  if (!name || !TABLE_NAME_REGEX.test(name)) {
    throw new Error(`Invalid table/collection name: ${name}`);
  }
  return name;
}
