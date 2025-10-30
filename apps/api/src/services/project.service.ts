import { prisma } from '../lib/prisma';
import { cache } from '../lib/redis';
import {
  ProjectsQueryParams,
  ProjectSummary,
  ProjectDetail,
  ProjectsListResponse,
  ProjectFilters,
} from '../types/project.types';
import { logger } from '../utils/logger';

const CACHE_TTL_SECONDS = 30 * 60; // 30 minutes as per TECHNICAL_DOCUMENTATION.md Section 5.1.2
const PROJECTS_CACHE_PREFIX = 'projects:list:';
const PROJECT_DETAIL_CACHE_PREFIX = 'projects:detail:';

/**
 * Project Service
 * Handles business logic for project operations with Redis caching (30 min TTL)
 */
export class ProjectService {
  /**
   * Get projects list with filtering and pagination
   * Returns project summaries with Redis caching (30 min TTL)
   */
  async getProjects(params: ProjectsQueryParams): Promise<ProjectsListResponse> {
    try {
      const { featured, category, tech, limit = 20, offset = 0 } = params;

      // Generate cache key based on query parameters
      const cacheKey = this.generateCacheKey(params);

      // Try to get from cache first
      const cached = await cache.get<ProjectsListResponse>(cacheKey);
      if (cached) {
        logger.debug('Projects list fetched from cache', { cacheKey });
        return cached;
      }

      // Cache miss - fetch from database
      logger.debug('Projects list cache miss - fetching from database', { params });

      // Build where clause based on filters
      const where: {
        featured?: boolean;
        category?: string;
        technologies?: { hasSome: string[] };
      } = {};

      if (featured !== undefined) {
        where.featured = featured;
      }

      if (category) {
        where.category = category;
      }

      if (tech && tech.length > 0) {
        where.technologies = { hasSome: tech };
      }

      // Get total count for pagination
      const total = await prisma.project.count({ where });

      // Fetch projects with filters, sorting, and pagination
      const projects = await prisma.project.findMany({
        where,
        orderBy: [{ featured: 'desc' }, { order: 'asc' }, { createdAt: 'desc' }],
        take: limit,
        skip: offset,
      });

      // Transform to summary format
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const projectSummaries: ProjectSummary[] = projects.map((project: any) => ({
        id: project.id,
        title: project.title,
        slug: project.slug,
        description: project.description,
        technologies: project.technologies,
        featured: project.featured,
        category: project.category,
        githubUrl: project.githubUrl,
        liveUrl: project.liveUrl,
        imageUrl: project.imageUrl,
        githubStars: project.githubStars,
        githubForks: project.githubForks,
      }));

      const response: ProjectsListResponse = {
        projects: projectSummaries,
        total,
        hasMore: offset + projectSummaries.length < total,
      };

      // Cache the result
      await cache.set(cacheKey, response, CACHE_TTL_SECONDS);
      logger.debug('Projects list cached successfully', { cacheKey });

      return response;
    } catch (error) {
      logger.error('Error fetching projects:', error);
      throw error;
    }
  }

  /**
   * Get project by slug
   * Returns detailed project information with Redis caching (30 min TTL)
   */
  async getProjectBySlug(slug: string): Promise<ProjectDetail | null> {
    try {
      const cacheKey = `${PROJECT_DETAIL_CACHE_PREFIX}${slug}`;

      // Try to get from cache first
      const cached = await cache.get<ProjectDetail>(cacheKey);
      if (cached) {
        logger.debug('Project detail fetched from cache', { slug });
        return cached;
      }

      // Cache miss - fetch from database
      logger.debug('Project detail cache miss - fetching from database', { slug });

      const project = await prisma.project.findUnique({
        where: { slug },
      });

      if (!project) {
        logger.info('Project not found', { slug });
        return null;
      }

      // Transform to detail format
      const projectDetail: ProjectDetail = {
        id: project.id,
        title: project.title,
        slug: project.slug,
        description: project.description,
        longDescription: project.longDescription,
        technologies: project.technologies,
        featured: project.featured,
        category: project.category,
        githubUrl: project.githubUrl,
        liveUrl: project.liveUrl,
        imageUrl: project.imageUrl,
        startDate: project.startDate ? project.startDate.toISOString() : null,
        endDate: project.endDate ? project.endDate.toISOString() : null,
        githubStars: project.githubStars,
        githubForks: project.githubForks,
        lastCommit: project.lastCommit ? project.lastCommit.toISOString() : null,
      };

      // Cache the result
      await cache.set(cacheKey, projectDetail, CACHE_TTL_SECONDS);
      logger.debug('Project detail cached successfully', { slug });

      return projectDetail;
    } catch (error) {
      logger.error('Error fetching project by slug:', error);
      throw error;
    }
  }

  /**
   * Get unique categories and technologies for filtering
   * Returns aggregated filter options with Redis caching (30 min TTL)
   */
  async getProjectFilters(): Promise<ProjectFilters> {
    try {
      const cacheKey = 'projects:filters';

      // Try to get from cache first
      const cached = await cache.get<ProjectFilters>(cacheKey);
      if (cached) {
        logger.debug('Project filters fetched from cache');
        return cached;
      }

      // Cache miss - fetch from database using aggregation
      logger.debug('Project filters cache miss - fetching from database');

      // Get unique categories (excluding null/empty)
      const categoriesResult = await prisma.project.findMany({
        select: { category: true },
        where: { category: { not: null } },
        distinct: ['category'],
        orderBy: { category: 'asc' },
      });

      // Get all technologies arrays and flatten them to get unique values
      const projectsWithTech = await prisma.project.findMany({
        select: { technologies: true },
        where: { technologies: { isEmpty: false } },
      });

      const categories = categoriesResult
        .map((p: { category: string | null }) => p.category)
        .filter((category: string | null): category is string => category !== null);

      // Flatten all technologies arrays and get unique values
      const allTechnologies: string[] = projectsWithTech.flatMap((p: { technologies: string[] }) => p.technologies);
      const technologies: string[] = [...new Set(allTechnologies)].sort();

      const filters: ProjectFilters = {
        categories,
        technologies,
      };

      // Cache the result
      await cache.set(cacheKey, filters, CACHE_TTL_SECONDS);
      logger.debug('Project filters cached successfully');

      return filters;
    } catch (error) {
      logger.error('Error fetching project filters:', error);
      throw error;
    }
  }

  /**
   * Invalidate all project caches
   * Should be called when projects are updated
   */
  async invalidateCache(): Promise<void> {
    try {
      // Delete all keys matching the patterns
      await cache.delPattern(`${PROJECTS_CACHE_PREFIX}*`);
      await cache.delPattern(`${PROJECT_DETAIL_CACHE_PREFIX}*`);
      await cache.del('projects:filters'); // Invalidate filters cache
      logger.debug('Project caches invalidated');
    } catch (error) {
      logger.error('Error invalidating project cache:', error);
      throw error;
    }
  }

  /**
   * Invalidate cache for a specific project
   */
  async invalidateProjectCache(slug: string): Promise<void> {
    try {
      const cacheKey = `${PROJECT_DETAIL_CACHE_PREFIX}${slug}`;
      await cache.del(cacheKey);
      // Also invalidate all list caches and filters cache as they may contain this project
      await cache.delPattern(`${PROJECTS_CACHE_PREFIX}*`);
      await cache.del('projects:filters'); // Invalidate filters cache
      logger.debug('Project cache invalidated', { slug });
    } catch (error) {
      logger.error('Error invalidating project cache:', error);
      throw error;
    }
  }

  /**
   * Generate cache key based on query parameters
   */
  private generateCacheKey(params: ProjectsQueryParams): string {
    const { featured, category, tech, limit, offset } = params;
    const parts = [PROJECTS_CACHE_PREFIX];

    if (featured !== undefined) {
      parts.push(`featured:${featured}`);
    }

    if (category) {
      parts.push(`category:${category}`);
    }

    if (tech && tech.length > 0) {
      parts.push(`tech:${tech.sort().join(',')}`);
    }

    parts.push(`limit:${limit}`);
    parts.push(`offset:${offset}`);

    return parts.join(':');
  }
}

// Export singleton instance
export const projectService = new ProjectService();
