import { Router } from 'express';
import { exportTable, importTable } from '../controllers/importExport.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { uploadImportFile } from '../middleware/upload.js';

export const importExportRouter = Router();

importExportRouter.get('/:id/tables/:table/export', asyncHandler(exportTable));
importExportRouter.post('/:id/tables/:table/import', uploadImportFile, asyncHandler(importTable));
