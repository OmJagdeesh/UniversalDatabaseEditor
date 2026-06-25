import { Router } from 'express';
import * as connectionController from '../controllers/connection.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { uploadDatabase } from '../middleware/upload.js';

export const connectionRouter = Router();

connectionRouter.post('/', uploadDatabase, asyncHandler(connectionController.create));
connectionRouter.get('/', asyncHandler(connectionController.list));
connectionRouter.post('/test', asyncHandler(connectionController.test));
connectionRouter.get('/:id', asyncHandler(connectionController.get));
connectionRouter.put('/:id', asyncHandler(connectionController.update));
connectionRouter.delete('/:id', asyncHandler(connectionController.remove));
connectionRouter.post('/:id/reconnect', asyncHandler(connectionController.reconnectConnection));
connectionRouter.patch('/:id/favorite', asyncHandler(connectionController.favorite));
