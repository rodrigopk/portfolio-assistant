import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { logger } from '../utils/logger';

const JWT_SECRET = process.env['JWT_SECRET'] || 'default-secret-change-in-production';

/**
 * Authentication middleware for admin endpoints
 * Verifies JWT token in Authorization header
 * Per TECHNICAL_DOCUMENTATION.md Section 9.1
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or invalid authorization header',
        },
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      logger.warn('Invalid JWT token', { error });
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired token',
        },
      });
      return;
    }
  } catch (error) {
    logger.error('Error in authentication middleware:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Authentication error',
      },
    });
    return;
  }
}

// Extend Express Request type to include user
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: string | jwt.JwtPayload;
    }
  }
}
