import { Request, Response } from 'express';

import { authService } from '../services/auth.service';
import { ApiResponse } from '../types';
import { LoginRequest, LoginResponse } from '../types/auth.types';
import { logger } from '../utils/logger';

/**
 * Authentication Controller
 * Handles HTTP requests for authentication endpoints
 * Per TECHNICAL_DOCUMENTATION.md Section 5.3
 */
export class AuthController {
  /**
   * POST /api/auth/login
   * Admin login endpoint
   * Per TECHNICAL_DOCUMENTATION.md Section 5.3
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body as LoginRequest;

      // Validate request body
      if (!email || !password) {
        res.status(400).json({
          error: {
            code: 'BAD_REQUEST',
            message: 'Email and password are required',
          },
        });
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({
          error: {
            code: 'BAD_REQUEST',
            message: 'Invalid email format',
          },
        });
        return;
      }

      try {
        const loginResponse = await authService.login({ email, password });

        const response: ApiResponse<LoginResponse> = {
          data: loginResponse,
        };

        res.status(200).json(response);
        logger.info('Login successful', { email });
      } catch (error) {
        // Don't expose whether email or password was wrong for security
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid credentials',
          },
        });
        logger.warn('Login failed', { email });
      }
    } catch (error) {
      logger.error('Error in login controller:', error);
      throw error; // Will be caught by error middleware
    }
  }
}

// Export singleton instance
export const authController = new AuthController();
