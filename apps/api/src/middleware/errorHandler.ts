import { Request, Response, NextFunction } from 'express';

import { logger } from '../utils/logger';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Log error
  logger.error({
    message: err.message,
    stack: err.stack,
    statusCode,
    path: req.path,
    method: req.method,
    code: err.code,
    details: err.details,
  });

  // Send error response
  res.status(statusCode).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message,
      ...(process.env['NODE_ENV'] === 'development' && {
        stack: err.stack,
        details: err.details,
      }),
    },
  });
};

export class AppError extends Error implements ApiError {
  constructor(
    public override message: string,
    public statusCode: number,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

// Helper functions to create common errors
export const createNotFoundError = (resource: string): AppError => {
  return new AppError(`${resource} not found`, 404, 'NOT_FOUND');
};

export const createValidationError = (details: unknown): AppError => {
  return new AppError('Validation failed', 400, 'VALIDATION_ERROR', details);
};

export const createUnauthorizedError = (message = 'Unauthorized'): AppError => {
  return new AppError(message, 401, 'UNAUTHORIZED');
};

export const createForbiddenError = (message = 'Forbidden'): AppError => {
  return new AppError(message, 403, 'FORBIDDEN');
};

export const createRateLimitError = (): AppError => {
  return new AppError('Too many requests', 429, 'RATE_LIMIT_EXCEEDED');
};
