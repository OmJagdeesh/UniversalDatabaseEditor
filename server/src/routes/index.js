import { Router } from 'express';
import { healthRouter } from './health.routes.js';
import { providerRouter } from './provider.routes.js';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/providers', providerRouter);
