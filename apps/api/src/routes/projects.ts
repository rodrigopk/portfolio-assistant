import { Router } from 'express';

import { projectController } from '../controllers/project.controller';
import { rateLimiter } from '../middleware/rateLimiter';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

/**
 * Project Routes
 * Rate limiting: 100 requests per 15 minutes per IP (general API rate limit)
 * Per TECHNICAL_DOCUMENTATION.md Section 5.4
 */

/**
 * GET /api/projects
 * Description: Get list of projects with optional filtering and pagination
 * Query Parameters:
 *   - featured: boolean (filter by featured projects)
 *   - category: string (filter by category)
 *   - tech: string (comma-separated list of technologies)
 *   - limit: number (default: 20, max: 100)
 *   - offset: number (default: 0)
 * Response: ProjectsListResponse with projects array, total count, and hasMore flag
 * Cache: 30 minutes (server-side Redis + client-side Cache-Control)
 * Rate Limit: General API rate limit (100 requests per 15 minutes)
 */
router.get('/', rateLimiter, asyncHandler(projectController.getProjects.bind(projectController)));

/**
 * GET /api/projects/filters
 * Description: Get unique categories and technologies for filtering
 * Response: ProjectFilters object with arrays of unique categories and technologies
 * Cache: 30 minutes (server-side Redis + client-side Cache-Control)
 * Rate Limit: General API rate limit (100 requests per 15 minutes)
 */
router.get('/filters', rateLimiter, asyncHandler(projectController.getProjectFilters.bind(projectController)));

/**
 * GET /api/projects/:slug
 * Description: Get detailed project information by slug
 * Path Parameters:
 *   - slug: string (unique project identifier)
 * Response: ProjectDetail object with complete project information
 * Cache: 30 minutes (server-side Redis + client-side Cache-Control)
 * Rate Limit: General API rate limit (100 requests per 15 minutes)
 * Error Handling: Returns 404 if project with given slug is not found
 */
router.get(
  '/:slug',
  rateLimiter,
  asyncHandler(projectController.getProjectBySlug.bind(projectController))
);

export default router;
