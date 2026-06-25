import { Router } from 'express';
import { execute } from '../controllers/query.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const queryRouter = Router();

queryRouter.post('/:id/query', asyncHandler(execute));
