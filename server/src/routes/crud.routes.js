import { Router } from 'express';
import * as crudController from '../controllers/crud.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const crudRouter = Router();

crudRouter.get('/:id/tables/:table/rows', asyncHandler(crudController.getRows));
crudRouter.post('/:id/tables/:table/rows', asyncHandler(crudController.insertRow));
crudRouter.put('/:id/tables/:table/rows/:pk', asyncHandler(crudController.updateRow));
crudRouter.delete('/:id/tables/:table/rows', asyncHandler(crudController.deleteRows));
