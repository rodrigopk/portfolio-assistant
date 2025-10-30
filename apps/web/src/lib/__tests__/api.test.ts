import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '../api';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProjects', () => {
    it('should transform backend ApiResponse format to frontend expected format', async () => {
      // Mock backend response in ApiResponse format
      const mockBackendResponse = {
        data: [
          {
            id: '1',
            title: 'Test Project',
            slug: 'test-project',
            description: 'A test project',
            technologies: ['React', 'TypeScript'],
            featured: true,
            category: 'web',
            githubUrl: 'https://github.com/test/project',
            liveUrl: 'https://test-project.com',
            imageUrl: null,
            githubStars: 10,
            githubForks: 2,
          },
        ],
        meta: {
          total: 1,
          hasMore: false,
          limit: 20,
          offset: 0,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBackendResponse),
      });

      const result = await api.getProjects();

      // Verify transformation to frontend expected format
      expect(result).toEqual({
        projects: mockBackendResponse.data,
        total: mockBackendResponse.meta.total,
        hasMore: mockBackendResponse.meta.hasMore,
      });

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/projects',
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
    });

    it('should handle empty response gracefully', async () => {
      const mockBackendResponse = {
        data: null,
        meta: {},
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBackendResponse),
      });

      const result = await api.getProjects();

      expect(result).toEqual({
        projects: [],
        total: 0,
        hasMore: false,
      });
    });

    it('should build query parameters correctly', async () => {
      const mockBackendResponse = {
        data: [],
        meta: { total: 0, hasMore: false },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBackendResponse),
      });

      await api.getProjects({
        featured: true,
        category: 'web',
        tech: ['React', 'TypeScript'],
        limit: 10,
        offset: 20,
      });

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/projects?featured=true&category=web&tech=React%2CTypeScript&limit=10&offset=20',
        expect.any(Object)
      );
    });
  });

  describe('getProjectBySlug', () => {
    it('should extract data from ApiResponse format', async () => {
      const mockProjectData = {
        id: '1',
        title: 'Test Project',
        slug: 'test-project',
        description: 'A test project',
        longDescription: 'A longer description',
        technologies: ['React', 'TypeScript'],
        featured: true,
        category: 'web',
        githubUrl: 'https://github.com/test/project',
        liveUrl: 'https://test-project.com',
        imageUrl: null,
        githubStars: 10,
        githubForks: 2,
        startDate: '2023-01-01',
        endDate: null,
        lastCommit: '2023-12-01',
      };

      const mockBackendResponse = {
        data: mockProjectData,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBackendResponse),
      });

      const result = await api.getProjectBySlug('test-project');

      expect(result).toEqual(mockProjectData);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/projects/test-project',
        expect.any(Object)
      );
    });
  });

  describe('getProjectFilters', () => {
    it('should extract data from ApiResponse format', async () => {
      const mockFiltersData = {
        categories: ['web', 'mobile', 'api'],
        technologies: ['React', 'TypeScript', 'Node.js'],
      };

      const mockBackendResponse = {
        data: mockFiltersData,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBackendResponse),
      });

      const result = await api.getProjectFilters();

      expect(result).toEqual(mockFiltersData);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/projects/filters',
        expect.any(Object)
      );
    });
  });

  describe('Error handling', () => {
    it('should throw ApiError on HTTP error', async () => {
      const mockErrorResponse = {
        error: {
          message: 'Not found',
          code: 'NOT_FOUND',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve(mockErrorResponse),
      });

      await expect(api.getProjects()).rejects.toThrow('Not found');
    });

    it('should throw network error on fetch failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(api.getProjects()).rejects.toThrow('Network error occurred');
    });
  });
});
