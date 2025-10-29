/* eslint-disable @typescript-eslint/no-explicit-any */
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';

import app from '../app';
import { prisma } from '../lib/prisma';
import { connectRedis, disconnectRedis, cache } from '../lib/redis';
import { ProjectService } from '../services/project.service';
import { ProjectSummary, ProjectDetail } from '../types/project.types';

// Mock project data
const mockProjects = [
  {
    id: 'project-1',
    title: 'E-commerce Platform',
    slug: 'ecommerce-platform',
    description: 'A full-stack e-commerce platform with payment integration',
    longDescription: 'Detailed description of the e-commerce platform...',
    technologies: ['React', 'Node.js', 'PostgreSQL', 'Stripe'],
    featured: true,
    category: 'web',
    githubUrl: 'https://github.com/user/ecommerce',
    liveUrl: 'https://ecommerce.example.com',
    imageUrl: 'https://example.com/ecommerce.jpg',
    startDate: new Date('2023-01-01'),
    endDate: new Date('2023-06-01'),
    githubStars: 150,
    githubForks: 25,
    lastCommit: new Date('2023-12-01'),
    order: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'project-2',
    title: 'Task Management App',
    slug: 'task-management-app',
    description: 'A collaborative task management application',
    longDescription: 'Detailed description of the task management app...',
    technologies: ['TypeScript', 'React', 'Express', 'MongoDB'],
    featured: false,
    category: 'web',
    githubUrl: 'https://github.com/user/tasks',
    liveUrl: null,
    imageUrl: null,
    startDate: new Date('2023-07-01'),
    endDate: null,
    githubStars: 50,
    githubForks: 10,
    lastCommit: new Date('2024-01-15'),
    order: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'project-3',
    title: 'Mobile Fitness Tracker',
    slug: 'mobile-fitness-tracker',
    description: 'A mobile app for tracking workouts and nutrition',
    longDescription: 'Detailed description of the fitness tracker...',
    technologies: ['React Native', 'Firebase', 'TypeScript'],
    featured: true,
    category: 'mobile',
    githubUrl: 'https://github.com/user/fitness',
    liveUrl: 'https://apps.apple.com/fitness',
    imageUrl: 'https://example.com/fitness.jpg',
    startDate: new Date('2022-06-01'),
    endDate: new Date('2023-03-01'),
    githubStars: 200,
    githubForks: 35,
    lastCommit: new Date('2023-11-20'),
    order: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockProjectSummaries: ProjectSummary[] = mockProjects.map((p) => ({
  id: p.id,
  title: p.title,
  slug: p.slug,
  description: p.description,
  technologies: p.technologies,
  featured: p.featured,
  category: p.category,
  githubUrl: p.githubUrl,
  liveUrl: p.liveUrl,
  imageUrl: p.imageUrl,
  githubStars: p.githubStars,
  githubForks: p.githubForks,
}));

const mockProjectDetail: ProjectDetail = {
  id: mockProjects[0].id,
  title: mockProjects[0].title,
  slug: mockProjects[0].slug,
  description: mockProjects[0].description,
  longDescription: mockProjects[0].longDescription,
  technologies: mockProjects[0].technologies,
  featured: mockProjects[0].featured,
  category: mockProjects[0].category,
  githubUrl: mockProjects[0].githubUrl,
  liveUrl: mockProjects[0].liveUrl,
  imageUrl: mockProjects[0].imageUrl,
  startDate: mockProjects[0].startDate?.toISOString() || null,
  endDate: mockProjects[0].endDate?.toISOString() || null,
  githubStars: mockProjects[0].githubStars,
  githubForks: mockProjects[0].githubForks,
  lastCommit: mockProjects[0].lastCommit?.toISOString() || null,
};

describe('Project API - Unit Tests', () => {
  describe('ProjectService', () => {
    let projectService: ProjectService;

    beforeEach(() => {
      projectService = new ProjectService();
      vi.clearAllMocks();
    });

    describe('getProjects', () => {
      it('should return projects from database when cache is empty', async () => {
        // Mock cache miss
        vi.spyOn(cache, 'get').mockResolvedValue(null);
        vi.spyOn(cache, 'set').mockResolvedValue(undefined);

        // Mock database response
        vi.spyOn(prisma.project, 'count').mockResolvedValue(mockProjects.length);
        vi.spyOn(prisma.project, 'findMany').mockResolvedValue(mockProjects as any);

        const result = await projectService.getProjects({ limit: 20, offset: 0 });

        expect(result.projects).toHaveLength(3);
        expect(result.total).toBe(3);
        expect(result.hasMore).toBe(false);
        expect(cache.get).toHaveBeenCalled();
        expect(prisma.project.findMany).toHaveBeenCalled();
        expect(cache.set).toHaveBeenCalled();
      });

      it('should return projects from cache when available', async () => {
        const cachedResponse = {
          projects: mockProjectSummaries,
          total: 3,
          hasMore: false,
        };

        // Mock cache hit
        vi.spyOn(cache, 'get').mockResolvedValue(cachedResponse);
        vi.spyOn(prisma.project, 'findMany').mockResolvedValue([]);

        const result = await projectService.getProjects({ limit: 20, offset: 0 });

        expect(result).toEqual(cachedResponse);
        expect(cache.get).toHaveBeenCalled();
        expect(prisma.project.findMany).not.toHaveBeenCalled();
      });

      it('should filter projects by featured flag', async () => {
        vi.spyOn(cache, 'get').mockResolvedValue(null);
        vi.spyOn(cache, 'set').mockResolvedValue(undefined);

        const featuredProjects = mockProjects.filter((p) => p.featured);
        vi.spyOn(prisma.project, 'count').mockResolvedValue(featuredProjects.length);
        vi.spyOn(prisma.project, 'findMany').mockResolvedValue(featuredProjects as any);

        const result = await projectService.getProjects({ featured: true, limit: 20, offset: 0 });

        expect(result.projects).toHaveLength(2);
        expect(result.projects.every((p) => p.featured)).toBe(true);
        expect(prisma.project.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({ featured: true }),
          })
        );
      });

      it('should filter projects by category', async () => {
        vi.spyOn(cache, 'get').mockResolvedValue(null);
        vi.spyOn(cache, 'set').mockResolvedValue(undefined);

        const webProjects = mockProjects.filter((p) => p.category === 'web');
        vi.spyOn(prisma.project, 'count').mockResolvedValue(webProjects.length);
        vi.spyOn(prisma.project, 'findMany').mockResolvedValue(webProjects as any);

        const result = await projectService.getProjects({
          category: 'web',
          limit: 20,
          offset: 0,
        });

        expect(result.projects).toHaveLength(2);
        expect(result.projects.every((p) => p.category === 'web')).toBe(true);
      });

      it('should filter projects by technologies', async () => {
        vi.spyOn(cache, 'get').mockResolvedValue(null);
        vi.spyOn(cache, 'set').mockResolvedValue(undefined);

        const reactProjects = mockProjects.filter((p) => p.technologies.includes('React'));
        vi.spyOn(prisma.project, 'count').mockResolvedValue(reactProjects.length);
        vi.spyOn(prisma.project, 'findMany').mockResolvedValue(reactProjects as any);

        const result = await projectService.getProjects({
          tech: ['React'],
          limit: 20,
          offset: 0,
        });

        expect(result.projects).toHaveLength(2);
        expect(prisma.project.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              technologies: { hasSome: ['React'] },
            }),
          })
        );
      });

      it('should handle pagination correctly', async () => {
        vi.spyOn(cache, 'get').mockResolvedValue(null);
        vi.spyOn(cache, 'set').mockResolvedValue(undefined);

        vi.spyOn(prisma.project, 'count').mockResolvedValue(10);
        vi.spyOn(prisma.project, 'findMany').mockResolvedValue([mockProjects[0]] as any);

        const result = await projectService.getProjects({ limit: 1, offset: 0 });

        expect(result.hasMore).toBe(true);
        expect(prisma.project.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            take: 1,
            skip: 0,
          })
        );
      });

      it('should exclude sensitive fields from summary', async () => {
        vi.spyOn(cache, 'get').mockResolvedValue(null);
        vi.spyOn(cache, 'set').mockResolvedValue(undefined);
        vi.spyOn(prisma.project, 'count').mockResolvedValue(1);
        vi.spyOn(prisma.project, 'findMany').mockResolvedValue([mockProjects[0]] as any);

        const result = await projectService.getProjects({ limit: 20, offset: 0 });

        const project = result.projects[0];
        expect(project).not.toHaveProperty('longDescription');
        expect(project).not.toHaveProperty('startDate');
        expect(project).not.toHaveProperty('endDate');
        expect(project).not.toHaveProperty('lastCommit');
        expect(project).not.toHaveProperty('order');
        expect(project).not.toHaveProperty('createdAt');
        expect(project).not.toHaveProperty('updatedAt');
      });

      it('should handle errors when fetching from database', async () => {
        vi.spyOn(cache, 'get').mockResolvedValue(null);
        const dbError = new Error('Database connection failed');
        vi.spyOn(prisma.project, 'count').mockRejectedValue(dbError);

        await expect(projectService.getProjects({ limit: 20, offset: 0 })).rejects.toThrow(
          'Database connection failed'
        );
      });
    });

    describe('getProjectBySlug', () => {
      it('should return project from database when cache is empty', async () => {
        vi.spyOn(cache, 'get').mockResolvedValue(null);
        vi.spyOn(cache, 'set').mockResolvedValue(undefined);
        vi.spyOn(prisma.project, 'findUnique').mockResolvedValue(mockProjects[0] as any);

        const result = await projectService.getProjectBySlug('ecommerce-platform');

        expect(result).toBeDefined();
        expect(result?.slug).toBe('ecommerce-platform');
        expect(result?.longDescription).toBeDefined();
        expect(cache.set).toHaveBeenCalled();
      });

      it('should return project from cache when available', async () => {
        vi.spyOn(cache, 'get').mockResolvedValue(mockProjectDetail);
        vi.spyOn(prisma.project, 'findUnique').mockResolvedValue(null);

        const result = await projectService.getProjectBySlug('ecommerce-platform');

        expect(result).toEqual(mockProjectDetail);
        expect(prisma.project.findUnique).not.toHaveBeenCalled();
      });

      it('should return null when project not found', async () => {
        vi.spyOn(cache, 'get').mockResolvedValue(null);
        vi.spyOn(prisma.project, 'findUnique').mockResolvedValue(null);

        const result = await projectService.getProjectBySlug('non-existent-project');

        expect(result).toBeNull();
      });

      it('should include all fields in detail view', async () => {
        vi.spyOn(cache, 'get').mockResolvedValue(null);
        vi.spyOn(cache, 'set').mockResolvedValue(undefined);
        vi.spyOn(prisma.project, 'findUnique').mockResolvedValue(mockProjects[0] as any);

        const result = await projectService.getProjectBySlug('ecommerce-platform');

        expect(result).toHaveProperty('longDescription');
        expect(result).toHaveProperty('startDate');
        expect(result).toHaveProperty('endDate');
        expect(result).toHaveProperty('lastCommit');
      });

      it('should handle errors when fetching from database', async () => {
        vi.spyOn(cache, 'get').mockResolvedValue(null);
        const dbError = new Error('Database error');
        vi.spyOn(prisma.project, 'findUnique').mockRejectedValue(dbError);

        await expect(projectService.getProjectBySlug('ecommerce-platform')).rejects.toThrow(
          'Database error'
        );
      });
    });

    describe('Cache invalidation', () => {
      it('should invalidate all project caches', async () => {
        vi.spyOn(cache, 'delPattern').mockResolvedValue(undefined);

        await projectService.invalidateCache();

        expect(cache.delPattern).toHaveBeenCalledTimes(2);
        expect(cache.delPattern).toHaveBeenCalledWith('projects:list:*');
        expect(cache.delPattern).toHaveBeenCalledWith('projects:detail:*');
      });

      it('should invalidate cache for specific project', async () => {
        vi.spyOn(cache, 'del').mockResolvedValue(undefined);
        vi.spyOn(cache, 'delPattern').mockResolvedValue(undefined);

        await projectService.invalidateProjectCache('ecommerce-platform');

        expect(cache.del).toHaveBeenCalledWith('projects:detail:ecommerce-platform');
        expect(cache.delPattern).toHaveBeenCalledWith('projects:list:*');
      });
    });
  });
});

describe('Project API - Integration Tests', () => {
  beforeAll(async () => {
    // Connect to Redis for integration tests
    try {
      await connectRedis();
    } catch (error) {
      console.warn('Redis connection failed, tests may not work properly:', error);
    }
  });

  afterAll(async () => {
    // Cleanup
    await cache.delPattern('projects:*');
    await disconnectRedis();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clear cache before each test
    await cache.delPattern('projects:*');
  });

  describe('GET /api/projects', () => {
    it('should return 200 and projects list', async () => {
      vi.spyOn(prisma.project, 'count').mockResolvedValue(mockProjects.length);
      vi.spyOn(prisma.project, 'findMany').mockResolvedValue(mockProjects as any);

      const response = await request(app).get('/api/projects');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta).toHaveProperty('total');
      expect(response.body.meta).toHaveProperty('hasMore');

      // Check response headers
      expect(response.headers['cache-control']).toBe('public, max-age=1800');
      expect(response.headers['etag']).toBeDefined();
    });

    it('should filter by featured flag', async () => {
      const featuredProjects = mockProjects.filter((p) => p.featured);
      vi.spyOn(prisma.project, 'count').mockResolvedValue(featuredProjects.length);
      vi.spyOn(prisma.project, 'findMany').mockResolvedValue(featuredProjects as any);

      const response = await request(app).get('/api/projects?featured=true');

      expect(response.status).toBe(200);
      expect(response.body.data.every((p: any) => p.featured)).toBe(true);
    });

    it('should filter by category', async () => {
      const webProjects = mockProjects.filter((p) => p.category === 'web');
      vi.spyOn(prisma.project, 'count').mockResolvedValue(webProjects.length);
      vi.spyOn(prisma.project, 'findMany').mockResolvedValue(webProjects as any);

      const response = await request(app).get('/api/projects?category=web');

      expect(response.status).toBe(200);
      expect(response.body.data.every((p: any) => p.category === 'web')).toBe(true);
    });

    it('should filter by technologies', async () => {
      const reactProjects = mockProjects.filter((p) => p.technologies.includes('React'));
      vi.spyOn(prisma.project, 'count').mockResolvedValue(reactProjects.length);
      vi.spyOn(prisma.project, 'findMany').mockResolvedValue(reactProjects as any);

      const response = await request(app).get('/api/projects?tech=React,TypeScript');

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should handle pagination with limit and offset', async () => {
      vi.spyOn(prisma.project, 'count').mockResolvedValue(10);
      vi.spyOn(prisma.project, 'findMany').mockResolvedValue([mockProjects[0]] as any);

      const response = await request(app).get('/api/projects?limit=1&offset=0');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.meta.hasMore).toBe(true);
      expect(response.body.meta.limit).toBe(1);
      expect(response.body.meta.offset).toBe(0);
    });

    it('should validate limit parameter', async () => {
      const response = await request(app).get('/api/projects?limit=150');

      expect(response.status).toBe(500); // Validation error caught by error handler
    });

    it('should handle database errors gracefully', async () => {
      vi.spyOn(prisma.project, 'count').mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/projects');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });

    it('should return correct content-type header', async () => {
      vi.spyOn(prisma.project, 'count').mockResolvedValue(0);
      vi.spyOn(prisma.project, 'findMany').mockResolvedValue([]);

      const response = await request(app).get('/api/projects');

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('GET /api/projects/:slug', () => {
    it('should return 200 and project detail', async () => {
      vi.spyOn(prisma.project, 'findUnique').mockResolvedValue(mockProjects[0] as any);

      const response = await request(app).get('/api/projects/ecommerce-platform');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('slug', 'ecommerce-platform');
      expect(response.body.data).toHaveProperty('longDescription');

      // Check response headers
      expect(response.headers['cache-control']).toBe('public, max-age=1800');
      expect(response.headers['etag']).toBeDefined();
    });

    it('should return 404 when project not found', async () => {
      vi.spyOn(prisma.project, 'findUnique').mockResolvedValue(null);

      const response = await request(app).get('/api/projects/non-existent-project');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatchObject({
        code: 'NOT_FOUND',
        message: 'Project not found',
      });
    });

    it('should return cached data on subsequent requests', async () => {
      vi.spyOn(prisma.project, 'findUnique').mockResolvedValue(mockProjects[0] as any);

      const response1 = await request(app).get('/api/projects/ecommerce-platform');
      expect(response1.status).toBe(200);

      vi.clearAllMocks();
      vi.spyOn(prisma.project, 'findUnique').mockResolvedValue(mockProjects[0] as any);

      const response2 = await request(app).get('/api/projects/ecommerce-platform');
      expect(response2.status).toBe(200);
      expect(response2.body.data).toEqual(response1.body.data);
    });

    it('should handle database errors gracefully', async () => {
      vi.spyOn(prisma.project, 'findUnique').mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/projects/ecommerce-platform');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Response schema validation', () => {
    it('should match list response schema', async () => {
      vi.spyOn(prisma.project, 'count').mockResolvedValue(1);
      vi.spyOn(prisma.project, 'findMany').mockResolvedValue([mockProjects[0]] as any);

      const response = await request(app).get('/api/projects');

      expect(response.status).toBe(200);

      const { data, meta } = response.body;

      // Verify list response structure
      expect(Array.isArray(data)).toBe(true);
      expect(meta).toHaveProperty('total');
      expect(meta).toHaveProperty('hasMore');
      expect(meta).toHaveProperty('limit');
      expect(meta).toHaveProperty('offset');

      // Verify project summary fields
      if (data.length > 0) {
        const project = data[0];
        expect(project).toHaveProperty('id');
        expect(project).toHaveProperty('title');
        expect(project).toHaveProperty('slug');
        expect(project).toHaveProperty('description');
        expect(project).toHaveProperty('technologies');
        expect(project).toHaveProperty('featured');
        expect(project).toHaveProperty('category');
        expect(Array.isArray(project.technologies)).toBe(true);
      }
    });

    it('should match detail response schema', async () => {
      vi.spyOn(prisma.project, 'findUnique').mockResolvedValue(mockProjects[0] as any);

      const response = await request(app).get('/api/projects/ecommerce-platform');

      expect(response.status).toBe(200);

      const { data } = response.body;

      // Verify project detail fields per TECHNICAL_DOCUMENTATION.md Section 5.1.2
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('title');
      expect(data).toHaveProperty('slug');
      expect(data).toHaveProperty('description');
      expect(data).toHaveProperty('longDescription');
      expect(data).toHaveProperty('technologies');
      expect(data).toHaveProperty('featured');
      expect(data).toHaveProperty('category');
      expect(data).toHaveProperty('githubUrl');
      expect(data).toHaveProperty('liveUrl');
      expect(data).toHaveProperty('imageUrl');
      expect(data).toHaveProperty('startDate');
      expect(data).toHaveProperty('endDate');
      expect(data).toHaveProperty('githubStars');
      expect(data).toHaveProperty('githubForks');
      expect(data).toHaveProperty('lastCommit');

      // Verify types
      expect(typeof data.id).toBe('string');
      expect(typeof data.title).toBe('string');
      expect(typeof data.slug).toBe('string');
      expect(typeof data.description).toBe('string');
      expect(Array.isArray(data.technologies)).toBe(true);
      expect(typeof data.featured).toBe('boolean');
      expect(typeof data.category).toBe('string');
    });
  });
});
