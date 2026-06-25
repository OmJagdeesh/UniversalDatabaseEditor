import { Router } from 'express';
import { listProviders } from '../controllers/provider.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const providerRouter = Router();

providerRouter.get('/', asyncHandler(listProviders));
