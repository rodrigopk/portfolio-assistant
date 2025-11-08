import { Router } from 'express';

import { githubController } from '../controllers/github.controller';
import { authenticate } from '../middleware/auth';
import { rateLimiter } from '../middleware/rateLimiter';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

/**
 * GitHub Routes
 * Rate limiting: 100 requests per 15 minutes per IP (general API rate limit)
 * Per TECHNICAL_DOCUMENTATION.md Section 5.1.8 and 5.4
 */

/**
 * POST /api/github/sync
 * Description: Trigger GitHub sync job to fetch and update projects from GitHub
 * Auth: Required (JWT token in Authorization header)
 * Response: GitHubSyncResponse with jobId and status
 * Rate Limit: General API rate limit (100 requests per 15 minutes)
 * Per TECHNICAL_DOCUMENTATION.md Section 5.1.8
 */
router.post(
  '/sync',
  authenticate,
  rateLimiter,
  asyncHandler(githubController.triggerSync.bind(githubController))
);

/**
 * GET /api/github/sync/:jobId
 * Description: Get sync job status by job ID
 * Auth: Optional (can be checked by anyone who has the job ID)
 * Response: GitHubSyncResult with detailed sync information
 * Rate Limit: General API rate limit (100 requests per 15 minutes)
 */
router.get(
  '/sync/:jobId',
  rateLimiter,
  asyncHandler(githubController.getSyncStatus.bind(githubController))
);

export default router;
