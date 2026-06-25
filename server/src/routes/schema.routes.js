import { Router } from 'express';
import { getSchema } from '../controllers/schema.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const schemaRouter = Router();

schemaRouter.get('/:id/tables/:table/schema', asyncHandler(getSchema));
