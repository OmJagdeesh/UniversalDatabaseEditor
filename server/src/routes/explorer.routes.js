import { Router } from 'express';
import { getTree } from '../controllers/explorer.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const explorerRouter = Router();

explorerRouter.get('/:id/explorer', asyncHandler(getTree));
