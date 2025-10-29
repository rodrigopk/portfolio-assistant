import { Router } from 'express';

import { profileController } from '../controllers/profile.controller';
import { asyncHandler } from '../utils/asyncHandler';
import { rateLimiter } from '../middleware/rateLimiter';

const router = Router();

/**
 * Profile Routes
 * Rate limiting: 100 requests per 15 minutes per IP (general API rate limit)
 * Per TECHNICAL_DOCUMENTATION.md Section 5.4
 */

/**
 * GET /api/profile
 * Description: Get portfolio owner's profile information
 * Response: ProfileResponse object
 * Cache: 60 minutes (server-side Redis + client-side Cache-Control)
 * Rate Limit: General API rate limit (100 requests per 15 minutes)
 */
router.get('/', rateLimiter, asyncHandler(profileController.getProfile.bind(profileController)));

export default router;
