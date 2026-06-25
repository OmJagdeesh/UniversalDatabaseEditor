import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

// Ensure upload directory exists
const uploadDir = path.resolve(env.uploadDir);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const ALLOWED_DB_EXTENSIONS = ['.db', '.sqlite', '.sqlite3'];
const ALLOWED_IMPORT_EXTENSIONS = ['.csv', '.json'];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

function fileFilter(allowedExtensions) {
  return (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(AppError.badRequest(`File type not allowed. Accepted: ${allowedExtensions.join(', ')}`));
    }
  };
}

// Middleware for uploading SQLite database files
export const uploadDatabase = multer({
  storage,
  fileFilter: fileFilter(ALLOWED_DB_EXTENSIONS),
  limits: { fileSize: env.maxUploadSize }
}).single('file');

// Middleware for uploading CSV/JSON import files
export const uploadImportFile = multer({
  storage,
  fileFilter: fileFilter(ALLOWED_IMPORT_EXTENSIONS),
  limits: { fileSize: env.maxUploadSize }
}).single('file');
