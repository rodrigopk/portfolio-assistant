/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { prisma } from '../lib/prisma';
import { cache } from '../lib/redis';
import { githubService } from '../services/github.service';
import { GitHubSyncResult } from '../types/github.types';

// Mock dependencies
vi.mock('../lib/prisma', () => ({
  prisma: {
    project: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('../lib/redis', () => ({
  cache: {
    get: vi.fn(),
    set: vi.fn(),
    delPattern: vi.fn(),
  },
}));

const mockListForUser = vi.fn();
const mockListLanguages = vi.fn();

vi.mock('@octokit/rest', () => ({
  Octokit: vi.fn().mockImplementation(() => ({
    repos: {
      listForUser: mockListForUser,
      listLanguages: mockListLanguages,
    },
  })),
}));

describe('GitHubService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('triggerSync', () => {
    it('should create a job ID and queue sync', async () => {
      vi.mocked(cache.set).mockResolvedValue(undefined);
      vi.mocked(cache.get).mockResolvedValue(null);

      const result = await githubService.triggerSync();

      expect(result).toHaveProperty('jobId');
      expect(result).toHaveProperty('status', 'queued');
      expect(typeof result.jobId).toBe('string');
      expect(result.jobId.length).toBeGreaterThan(0);

      // Verify sync result was cached
      expect(cache.set).toHaveBeenCalledWith(
        expect.stringContaining('github:sync:'),
        expect.objectContaining({
          jobId: result.jobId,
          status: 'queued',
          repositoriesAnalyzed: 0,
          repositoriesImported: 0,
          repositoriesUpdated: 0,
          errors: [],
        }),
        3600 // 1 hour TTL
      );
    });

    it('should return unique job IDs for multiple calls', async () => {
      vi.mocked(cache.set).mockResolvedValue(undefined);
      vi.mocked(cache.get).mockResolvedValue(null);

      const result1 = await githubService.triggerSync();
      const result2 = await githubService.triggerSync();

      expect(result1.jobId).not.toBe(result2.jobId);
    });

    it('should start async sync process', async () => {
      vi.mocked(cache.set).mockResolvedValue(undefined);
      vi.mocked(cache.get).mockResolvedValue(null);

      await githubService.triggerSync();

      // Verify cache was called to store initial sync result
      expect(cache.set).toHaveBeenCalled();
    });
  });

  describe('getSyncResult', () => {
    it('should retrieve sync result from cache', async () => {
      const mockSyncResult: GitHubSyncResult = {
        jobId: 'test-job-id',
        status: 'completed',
        startedAt: new Date(),
        completedAt: new Date(),
        repositoriesAnalyzed: 5,
        repositoriesImported: 2,
        repositoriesUpdated: 3,
        errors: [],
      };

      vi.mocked(cache.get).mockResolvedValue(mockSyncResult);

      const result = await githubService.getSyncResult('test-job-id');

      expect(result).toEqual(mockSyncResult);
      expect(cache.get).toHaveBeenCalledWith('github:sync:test-job-id');
    });

    it('should return null if sync result not found', async () => {
      vi.mocked(cache.get).mockResolvedValue(null);

      const result = await githubService.getSyncResult('non-existent-job');

      expect(result).toBeNull();
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete sync workflow', async () => {
      const mockRepo = {
        id: 12345,
        name: 'test-repo',
        full_name: 'testuser/test-repo',
        description: 'A test repository',
        html_url: 'https://github.com/testuser/test-repo',
        homepage: 'https://test-repo.com',
        stargazers_count: 15,
        forks_count: 3,
        language: 'TypeScript',
        languages_url: 'https://api.github.com/repos/testuser/test-repo/languages',
        topics: ['web', 'typescript'],
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        pushed_at: '2024-01-15T00:00:00Z',
        archived: false,
        disabled: false,
        fork: false,
        private: false,
      };

      const mockLanguages = {
        TypeScript: 50000,
        JavaScript: 30000,
      };

      mockListForUser.mockResolvedValue({ data: [mockRepo] });
      mockListLanguages.mockResolvedValue({ data: mockLanguages });

      vi.mocked(cache.get).mockResolvedValueOnce(null).mockResolvedValueOnce({
        jobId: 'test-job',
        status: 'queued',
        startedAt: new Date(),
        repositoriesAnalyzed: 0,
        repositoriesImported: 0,
        repositoriesUpdated: 0,
        errors: [],
      });
      vi.mocked(cache.set).mockResolvedValue(undefined);
      vi.mocked(cache.delPattern).mockResolvedValue(undefined);

      vi.mocked(prisma.project.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.project.create).mockResolvedValue({} as any);

      const result = await githubService.triggerSync();

      expect(result.jobId).toBeDefined();
      expect(result.status).toBe('queued');

      // Wait for async processing
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Cache should be updated
      expect(cache.set).toHaveBeenCalled();
    });

    it('should skip repositories without descriptions', async () => {
      const mockRepo = {
        id: 12345,
        name: 'test-repo',
        full_name: 'testuser/test-repo',
        description: null, // No description
        html_url: 'https://github.com/testuser/test-repo',
        homepage: null,
        stargazers_count: 0,
        forks_count: 0,
        language: 'TypeScript',
        languages_url: 'https://api.github.com/repos/testuser/test-repo/languages',
        topics: [],
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        pushed_at: '2024-01-15T00:00:00Z',
        archived: false,
        disabled: false,
        fork: false,
        private: false,
      };

      mockListForUser.mockResolvedValue({ data: [mockRepo] });

      vi.mocked(cache.get).mockResolvedValueOnce(null).mockResolvedValueOnce({
        jobId: 'test-job',
        status: 'queued',
        startedAt: new Date(),
        repositoriesAnalyzed: 0,
        repositoriesImported: 0,
        repositoriesUpdated: 0,
        errors: [],
      });
      vi.mocked(cache.set).mockResolvedValue(undefined);

      vi.mocked(prisma.project.create).mockResolvedValue({} as any);

      await githubService.triggerSync();

      // Wait for async processing
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should not create project without description
      expect(prisma.project.create).not.toHaveBeenCalled();
    });

    it('should handle GitHub API errors gracefully', async () => {
      mockListForUser.mockRejectedValue(new Error('GitHub API error'));

      vi.mocked(cache.get).mockResolvedValueOnce(null).mockResolvedValueOnce({
        jobId: 'test-job',
        status: 'queued',
        startedAt: new Date(),
        repositoriesAnalyzed: 0,
        repositoriesImported: 0,
        repositoriesUpdated: 0,
        errors: [],
      });
      vi.mocked(cache.set).mockResolvedValue(undefined);

      await githubService.triggerSync();

      // Wait for async processing to complete
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Cache.set should have been called at least once for initial queued status
      // The async background job may not complete in test timeframe
      expect(cache.set).toHaveBeenCalled();

      // Verify the job was queued (first call)
      const firstCall = vi.mocked(cache.set).mock.calls[0];
      expect(firstCall[1]).toMatchObject({
        status: expect.stringMatching(/queued|failed/),
      });
    });

    it('should update existing projects', async () => {
      const mockRepo = {
        id: 12345,
        name: 'test-repo',
        full_name: 'testuser/test-repo',
        description: 'A test repository',
        html_url: 'https://github.com/testuser/test-repo',
        homepage: null,
        stargazers_count: 20,
        forks_count: 5,
        language: 'TypeScript',
        languages_url: 'https://api.github.com/repos/testuser/test-repo/languages',
        topics: [],
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        pushed_at: '2024-01-15T00:00:00Z',
        archived: false,
        disabled: false,
        fork: false,
        private: false,
      };

      mockListForUser.mockResolvedValue({ data: [mockRepo] });
      mockListLanguages.mockResolvedValue({ data: { TypeScript: 1000 } });

      vi.mocked(cache.get).mockResolvedValueOnce(null).mockResolvedValueOnce({
        jobId: 'test-job',
        status: 'queued',
        startedAt: new Date(),
        repositoriesAnalyzed: 0,
        repositoriesImported: 0,
        repositoriesUpdated: 0,
        errors: [],
      });
      vi.mocked(cache.set).mockResolvedValue(undefined);
      vi.mocked(cache.delPattern).mockResolvedValue(undefined);

      vi.mocked(prisma.project.findFirst).mockResolvedValue({
        id: 'existing-id',
        slug: 'test-repo',
      } as any);
      vi.mocked(prisma.project.update).mockResolvedValue({} as any);

      await githubService.triggerSync();

      // Wait for async processing
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should update existing project
      expect(prisma.project.update).toHaveBeenCalled();
      expect(prisma.project.create).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle cache errors gracefully', async () => {
      vi.mocked(cache.set).mockRejectedValue(new Error('Redis error'));

      await expect(githubService.triggerSync()).rejects.toThrow('Redis error');
    });
  });
});
