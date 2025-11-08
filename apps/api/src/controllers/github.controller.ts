import { Request, Response } from 'express';

import { githubService } from '../services/github.service';
import { ApiResponse } from '../types';
import { GitHubSyncResponse } from '../types/github.types';
import { logger } from '../utils/logger';

/**
 * GitHub Controller
 * Handles HTTP requests for GitHub sync endpoints
 * Per TECHNICAL_DOCUMENTATION.md Section 5.1.8
 */
export class GitHubController {
  /**
   * POST /api/github/sync
   * Triggers GitHub sync job (admin only)
   * Per TECHNICAL_DOCUMENTATION.md Section 5.1.8
   */
  async triggerSync(_req: Request, res: Response): Promise<void> {
    try {
      const result = await githubService.triggerSync();

      const syncResponse: GitHubSyncResponse = {
        jobId: result.jobId,
        status: result.status,
        message: 'GitHub sync job has been queued successfully',
      };

      const response: ApiResponse<GitHubSyncResponse> = {
        data: syncResponse,
      };

      res.status(202).json(response);
      logger.info('GitHub sync triggered successfully', { jobId: result.jobId });
    } catch (error) {
      logger.error('Error in triggerSync controller:', error);
      throw error; // Will be caught by error middleware
    }
  }

  /**
   * GET /api/github/sync/:jobId
   * Get sync job status by job ID
   */
  async getSyncStatus(req: Request, res: Response): Promise<void> {
    try {
      const { jobId } = req.params;

      if (!jobId) {
        res.status(400).json({
          error: {
            code: 'BAD_REQUEST',
            message: 'Job ID is required',
          },
        });
        return;
      }

      const syncResult = await githubService.getSyncResult(jobId);

      if (!syncResult) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Sync job not found or expired',
          },
        });
        return;
      }

      const response: ApiResponse = {
        data: syncResult,
      };

      res.status(200).json(response);
      logger.info('Sync status retrieved successfully', { jobId });
    } catch (error) {
      logger.error('Error in getSyncStatus controller:', error);
      throw error; // Will be caught by error middleware
    }
  }
}

// Export singleton instance
export const githubController = new GitHubController();
