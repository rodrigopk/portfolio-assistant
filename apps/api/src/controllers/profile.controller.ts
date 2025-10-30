import { Request, Response } from 'express';

import { createNotFoundError } from '../middleware/errorHandler';
import { profileService } from '../services/profile.service';
import { ApiResponse } from '../types';
import { logger } from '../utils/logger';

/**
 * Profile Controller
 * Handles HTTP requests for profile endpoints with error handling per Section 5.5
 */
export class ProfileController {
  /**
   * GET /api/profile
   * Returns profile information with Redis caching (60 min TTL)
   * Per TECHNICAL_DOCUMENTATION.md Section 5.1.1
   */
  async getProfile(_req: Request, res: Response): Promise<void> {
    try {
      const profile = await profileService.getProfile();

      if (!profile) {
        throw createNotFoundError('Profile');
      }

      const response: ApiResponse = {
        data: profile,
      };

      // Set cache headers for client-side caching
      res.set({
        'Cache-Control': 'public, max-age=3600', // 1 hour
        ETag: `"profile-${Date.now()}"`,
      });

      res.status(200).json(response);
      logger.info('Profile retrieved successfully');
    } catch (error) {
      logger.error('Error in getProfile controller:', error);
      throw error; // Will be caught by error middleware
    }
  }
}

// Export singleton instance
export const profileController = new ProfileController();
