import { Request, Response } from 'express';

import { createNotFoundError } from '../middleware/errorHandler';
import { projectService } from '../services/project.service';
import { ApiResponse } from '../types';
import { projectsQuerySchema, projectSlugSchema } from '../types/project.types';
import { logger } from '../utils/logger';

/**
 * Project Controller
 * Handles HTTP requests for project endpoints with error handling per Section 5.5
 */
export class ProjectController {
  /**
   * GET /api/projects
   * Returns list of projects with filtering, pagination, and Redis caching (30 min TTL)
   * Per TECHNICAL_DOCUMENTATION.md Section 5.1.2
   */
  async getProjects(req: Request, res: Response): Promise<void> {
    try {
      // Validate query parameters using Zod
      const validatedQuery = projectsQuerySchema.parse(req.query);

      const result = await projectService.getProjects(validatedQuery);

      const response: ApiResponse = {
        data: result.projects,
        meta: {
          total: result.total,
          hasMore: result.hasMore,
          limit: validatedQuery.limit,
          offset: validatedQuery.offset,
        },
      };

      // Set cache headers for client-side caching (30 minutes)
      res.set({
        'Cache-Control': 'public, max-age=1800', // 30 minutes
        ETag: `"projects-${Date.now()}"`,
      });

      res.status(200).json(response);
      logger.info('Projects list retrieved successfully', {
        count: result.projects.length,
        total: result.total,
      });
    } catch (error) {
      logger.error('Error in getProjects controller:', error);
      throw error; // Will be caught by error middleware
    }
  }

  /**
   * GET /api/projects/:slug
   * Returns detailed project information with Redis caching (30 min TTL)
   * Per TECHNICAL_DOCUMENTATION.md Section 5.1.2
   * Returns 404 if project with given slug is not found
   */
  async getProjectBySlug(req: Request, res: Response): Promise<void> {
    try {
      // Validate slug parameter using Zod
      const validatedParams = projectSlugSchema.parse(req.params);

      const project = await projectService.getProjectBySlug(validatedParams.slug);

      if (!project) {
        throw createNotFoundError('Project');
      }

      const response: ApiResponse = {
        data: project,
      };

      // Set cache headers for client-side caching (30 minutes)
      res.set({
        'Cache-Control': 'public, max-age=1800', // 30 minutes
        ETag: `"project-${validatedParams.slug}-${Date.now()}"`,
      });

      res.status(200).json(response);
      logger.info('Project retrieved successfully', { slug: validatedParams.slug });
    } catch (error) {
      logger.error('Error in getProjectBySlug controller:', error);
      throw error; // Will be caught by error middleware
    }
  }

  /**
   * GET /api/projects/filters
   * Returns unique categories and technologies for filtering with Redis caching (30 min TTL)
   * Per TECHNICAL_DOCUMENTATION.md Section 5.1.2
   */
  async getProjectFilters(_req: Request, res: Response): Promise<void> {
    try {
      const filters = await projectService.getProjectFilters();

      const response: ApiResponse = {
        data: filters,
      };

      // Set cache headers for client-side caching (30 minutes)
      res.set({
        'Cache-Control': 'public, max-age=1800', // 30 minutes
        ETag: `"project-filters-${Date.now()}"`,
      });

      res.status(200).json(response);
      logger.info('Project filters retrieved successfully', {
        categoriesCount: filters.categories.length,
        technologiesCount: filters.technologies.length,
      });
    } catch (error) {
      logger.error('Error in getProjectFilters controller:', error);
      throw error; // Will be caught by error middleware
    }
  }
}

// Export singleton instance
export const projectController = new ProjectController();
