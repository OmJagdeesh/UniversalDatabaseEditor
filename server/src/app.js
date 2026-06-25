import cors from 'cors';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { apiRouter } from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';

export function createApp() {
  const app = express();

  // Ensure uploads directory exists
  const uploadDir = path.resolve(env.uploadDir);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  app.use(helmet());
  app.use(cors({ origin: env.corsOrigin }));
  app.use(express.json({ limit: '10mb' }));
  app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

  app.use('/api', apiRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
