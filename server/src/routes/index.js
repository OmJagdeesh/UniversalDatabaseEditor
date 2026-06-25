import { Router } from 'express';
import { healthRouter } from './health.routes.js';
import { providerRouter } from './provider.routes.js';
import { connectionRouter } from './connection.routes.js';
import { explorerRouter } from './explorer.routes.js';
import { crudRouter } from './crud.routes.js';
import { queryRouter } from './query.routes.js';
import { schemaRouter } from './schema.routes.js';
import { importExportRouter } from './importExport.routes.js';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/providers', providerRouter);
apiRouter.use('/connections', connectionRouter);

// These routes are nested under /connections/:id so they share the connection context
apiRouter.use('/connections', explorerRouter);
apiRouter.use('/connections', crudRouter);
apiRouter.use('/connections', queryRouter);
apiRouter.use('/connections', schemaRouter);
apiRouter.use('/connections', importExportRouter);
