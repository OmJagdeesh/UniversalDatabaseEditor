import { AppError } from '../utils/AppError.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  const appError = error instanceof AppError ? error : AppError.internal(error.message || 'Internal server error');

  if (appError.statusCode >= 500) {
    logger.error(error);
  }

  return res.status(appError.statusCode).json({
    message: appError.message,
    ...(env.nodeEnv === 'development' && { stack: error.stack })
  });
}
