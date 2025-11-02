// Mock the database monitor first
vi.mock('@portfolio/database', () => ({
  databaseMonitor: {
    getHealthStatus: vi.fn(),
    isHealthy: vi.fn(),
  },
}));

// Mock the logger
vi.mock('../utils/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

import { databaseMonitor } from '@portfolio/database';
import express from 'express';
import request from 'supertest';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import healthRoutes from '../routes/health';

const mockDatabaseMonitor = databaseMonitor as typeof databaseMonitor & {
  getHealthStatus: ReturnType<typeof vi.fn>;
  isHealthy: ReturnType<typeof vi.fn>;
};

describe('Health Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use('/health', healthRoutes);
    vi.clearAllMocks();
  });

  describe('GET /health', () => {
    it('should return 200 when database is healthy', async () => {
      mockDatabaseMonitor.getHealthStatus.mockResolvedValue({
        healthy: true,
        status: 'healthy',
        checks: {},
        metrics: { connectionPool: {}, performance: {}, errors: {} },
      });

      const response = await request(app).get('/health').expect(200);

      expect(response.body).toMatchObject({
        status: 'ok',
        checks: {
          database: true,
        },
      });
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeGreaterThan(0);
    });

    it('should return 503 when database is unhealthy', async () => {
      mockDatabaseMonitor.getHealthStatus.mockResolvedValue({
        healthy: false,
        status: 'unhealthy',
        checks: {},
        metrics: { connectionPool: {}, performance: {}, errors: {} },
      });

      const response = await request(app).get('/health').expect(503);

      expect(response.body).toMatchObject({
        status: 'error',
        checks: {
          database: false,
        },
      });
    });

    it('should return 503 when health check throws error', async () => {
      mockDatabaseMonitor.getHealthStatus.mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app).get('/health').expect(503);

      expect(response.body).toMatchObject({
        status: 'error',
        error: 'Service unavailable',
      });
    });
  });

  describe('GET /health/ready', () => {
    it('should return 200 when database is healthy', async () => {
      mockDatabaseMonitor.isHealthy.mockResolvedValue(true);

      const response = await request(app).get('/health/ready').expect(200);

      expect(response.body).toMatchObject({
        status: 'ready',
      });
      expect(response.body.timestamp).toBeDefined();
    });

    it('should return 503 when database is not healthy', async () => {
      mockDatabaseMonitor.isHealthy.mockResolvedValue(false);

      const response = await request(app).get('/health/ready').expect(503);

      expect(response.body).toMatchObject({
        status: 'not ready',
        reason: 'database not healthy',
      });
    });

    it('should return 503 when readiness check throws error', async () => {
      mockDatabaseMonitor.isHealthy.mockRejectedValue(new Error('Connection failed'));

      const response = await request(app).get('/health/ready').expect(503);

      expect(response.body).toMatchObject({
        status: 'not ready',
        error: 'Service not ready',
      });
    });
  });

  describe('GET /health/live', () => {
    it('should always return 200', async () => {
      const response = await request(app).get('/health/live').expect(200);

      expect(response.body).toMatchObject({
        status: 'alive',
      });
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('GET /health/database', () => {
    it('should return detailed database health when healthy', async () => {
      const mockHealthStatus = {
        healthy: true,
        status: 'healthy',
        checks: { connection: true, migration: true },
        metrics: {
          connectionPool: { active: 5, idle: 10 },
          performance: { avgResponseTime: 50 },
          errors: { count: 0 },
        },
      };

      mockDatabaseMonitor.getHealthStatus.mockResolvedValue(mockHealthStatus);

      const response = await request(app).get('/health/database').expect(200);

      expect(response.body).toMatchObject({
        status: 'healthy',
        checks: { connection: true, migration: true },
        metrics: {
          connectionPool: { active: 5, idle: 10 },
          performance: { avgResponseTime: 50 },
          errors: { count: 0 },
        },
      });
    });

    it('should return 503 when database is unhealthy', async () => {
      const mockHealthStatus = {
        healthy: false,
        status: 'unhealthy',
        checks: { connection: false },
        metrics: {
          connectionPool: {},
          performance: {},
          errors: { count: 5 },
        },
      };

      mockDatabaseMonitor.getHealthStatus.mockResolvedValue(mockHealthStatus);

      const response = await request(app).get('/health/database').expect(503);

      expect(response.body.status).toBe('unhealthy');
    });

    it('should return 503 when database health check throws error', async () => {
      mockDatabaseMonitor.getHealthStatus.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/health/database').expect(503);

      expect(response.body).toMatchObject({
        status: 'critical',
        error: 'Health check failed',
      });
    });
  });
});
