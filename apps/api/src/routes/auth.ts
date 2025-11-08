import { Router } from 'express';

import { authController } from '../controllers/auth.controller';
import { rateLimiter } from '../middleware/rateLimiter';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

/**
 * Authentication Routes
 * Rate limiting: 100 requests per 15 minutes per IP (general API rate limit)
 * Per TECHNICAL_DOCUMENTATION.md Section 5.3 and 5.4
 */

/**
 * POST /api/auth/login
 * Description: Admin login endpoint
 * Request: { email: string, password: string }
 * Response: { token: string, expiresIn: number }
 * Rate Limit: General API rate limit (100 requests per 15 minutes)
 * Per TECHNICAL_DOCUMENTATION.md Section 5.3
 */
router.post('/login', rateLimiter, asyncHandler(authController.login.bind(authController)));

export default router;
