import dotenv from 'dotenv';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';

dotenv.config();

// Generate a default 32-byte hex key for development if not provided
const defaultSecret = randomBytes(32).toString('hex');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().url().default('http://127.0.0.1:5173'),
  CREDENTIAL_SECRET: z.string().length(64, 'Must be a 32-byte hex string (64 chars)').default(defaultSecret),
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_UPLOAD_SIZE: z.coerce.number().int().positive().default(52428800) // 50 MB
});

const parsedEnv = envSchema.parse(process.env);

export const env = {
  nodeEnv: parsedEnv.NODE_ENV,
  port: parsedEnv.PORT,
  corsOrigin: parsedEnv.CORS_ORIGIN,
  credentialSecret: parsedEnv.CREDENTIAL_SECRET,
  uploadDir: parsedEnv.UPLOAD_DIR,
  maxUploadSize: parsedEnv.MAX_UPLOAD_SIZE
};
