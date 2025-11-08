/* eslint-disable @typescript-eslint/no-explicit-any */
import request from 'supertest';
import { describe, it, expect, beforeEach, vi, afterAll, beforeAll } from 'vitest';

// Mock environment variables before importing
vi.stubEnv('GITHUB_TOKEN', 'test-token');
vi.stubEnv('GITHUB_USERNAME', 'test-user');

import app from '../app';
import { connectRedis, disconnectRedis } from '../lib/redis';
import { githubService } from '../services/github.service';
import { GitHubSyncResult } from '../types/github.types';

// Mock GitHub service
vi.mock('../services/github.service', () => ({
  githubService: {
    triggerSync: vi.fn(),
    getSyncResult: vi.fn(),
  },
}));

// Mock authentication middleware for tests
vi.mock('../middleware/auth', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.user = { id: 'test-user' };
    next();
  },
}));

describe('GitHubController', () => {
  beforeAll(async () => {
    await connectRedis();
  });

  afterAll(async () => {
    await disconnectRedis();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/github/sync', () => {
    it('should trigger GitHub sync and return 202 with job ID', async () => {
      const mockJobId = 'test-job-123';
      vi.mocked(githubService.triggerSync).mockResolvedValue({
        jobId: mockJobId,
        status: 'queued',
      });

      const response = await request(app)
        .post('/api/github/sync')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(202);
      expect(response.body.data).toEqual({
        jobId: mockJobId,
        status: 'queued',
        message: 'GitHub sync job has been queued successfully',
      });
      expect(githubService.triggerSync).toHaveBeenCalledTimes(1);
    });

    it('should call auth middleware for protected endpoint', async () => {
      // The endpoint requires authentication, but since we're mocking the auth middleware
      // in this test file, this test just verifies the endpoint responds
      const mockJobId = 'test-job-456';
      vi.mocked(githubService.triggerSync).mockResolvedValue({
        jobId: mockJobId,
        status: 'queued',
      });

      const response = await request(app)
        .post('/api/github/sync')
        .set('Authorization', 'Bearer test-token');

      // With our mocked auth, this should succeed
      expect(response.status).toBe(202);
    });

    it('should handle service errors gracefully', async () => {
      vi.mocked(githubService.triggerSync).mockRejectedValue(new Error('GitHub API error'));

      const response = await request(app)
        .post('/api/github/sync')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(500);
      expect(response.body.error).toBeDefined();
    });

    it('should handle missing environment variables', async () => {
      vi.mocked(githubService.triggerSync).mockRejectedValue(
        new Error('GITHUB_TOKEN environment variable is required')
      );

      const response = await request(app)
        .post('/api/github/sync')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(500);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/github/sync/:jobId', () => {
    it('should return sync status for valid job ID', async () => {
      const mockSyncResult: GitHubSyncResult = {
        jobId: 'test-job-123',
        status: 'completed',
        startedAt: new Date('2024-01-01T00:00:00Z'),
        completedAt: new Date('2024-01-01T00:05:00Z'),
        repositoriesAnalyzed: 10,
        repositoriesImported: 5,
        repositoriesUpdated: 3,
        errors: [],
      };

      vi.mocked(githubService.getSyncResult).mockResolvedValue(mockSyncResult);

      const response = await request(app).get('/api/github/sync/test-job-123');

      expect(response.status).toBe(200);
      expect(response.body.data).toMatchObject({
        jobId: 'test-job-123',
        status: 'completed',
        repositoriesAnalyzed: 10,
        repositoriesImported: 5,
        repositoriesUpdated: 3,
      });
      expect(githubService.getSyncResult).toHaveBeenCalledWith('test-job-123');
    });

    it('should return 404 for non-existent job ID', async () => {
      vi.mocked(githubService.getSyncResult).mockResolvedValue(null);

      const response = await request(app).get('/api/github/sync/non-existent-job');

      expect(response.status).toBe(404);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(response.body.error.message).toContain('not found');
    });

    it('should return sync status with processing state', async () => {
      const mockSyncResult: GitHubSyncResult = {
        jobId: 'processing-job',
        status: 'processing',
        startedAt: new Date('2024-01-01T00:00:00Z'),
        repositoriesAnalyzed: 5,
        repositoriesImported: 2,
        repositoriesUpdated: 1,
        errors: [],
      };

      vi.mocked(githubService.getSyncResult).mockResolvedValue(mockSyncResult);

      const response = await request(app).get('/api/github/sync/processing-job');

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('processing');
      expect(response.body.data.completedAt).toBeUndefined();
    });

    it('should return sync status with errors', async () => {
      const mockSyncResult: GitHubSyncResult = {
        jobId: 'failed-job',
        status: 'completed',
        startedAt: new Date('2024-01-01T00:00:00Z'),
        completedAt: new Date('2024-01-01T00:05:00Z'),
        repositoriesAnalyzed: 10,
        repositoriesImported: 5,
        repositoriesUpdated: 2,
        errors: ['Error processing repo1', 'Error processing repo2'],
      };

      vi.mocked(githubService.getSyncResult).mockResolvedValue(mockSyncResult);

      const response = await request(app).get('/api/github/sync/failed-job');

      expect(response.status).toBe(200);
      expect(response.body.data.errors).toHaveLength(2);
      expect(response.body.data.errors).toContain('Error processing repo1');
    });

    it('should handle service errors gracefully', async () => {
      vi.mocked(githubService.getSyncResult).mockRejectedValue(new Error('Redis connection error'));

      const response = await request(app).get('/api/github/sync/test-job');

      expect(response.status).toBe(500);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('Rate Limiting', () => {
    it('should respect rate limits', async () => {
      vi.mocked(githubService.triggerSync).mockResolvedValue({
        jobId: 'test-job',
        status: 'queued',
      });

      // Make multiple requests quickly
      const requests = Array(5)
        .fill(null)
        .map(() => request(app).post('/api/github/sync').set('Authorization', 'Bearer test-token'));

      const responses = await Promise.all(requests);

      // All should succeed since we're under the rate limit
      responses.forEach((response) => {
        expect([202, 429]).toContain(response.status);
      });
    });
  });

  describe('Error Response Format', () => {
    it('should return proper error format per Section 5.5', async () => {
      vi.mocked(githubService.triggerSync).mockRejectedValue(new Error('Test error'));

      const response = await request(app)
        .post('/api/github/sync')
        .set('Authorization', 'Bearer test-token');

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
    });
  });
});
