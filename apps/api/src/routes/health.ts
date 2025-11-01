import { databaseMonitor } from '@portfolio/database';
import { Router, Request, Response } from 'express';

import { logger } from '../utils/logger';

const router = Router();

interface HealthCheck {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  environment: string;
  checks: {
    database?: boolean;
    redis?: boolean;
    ai?: boolean;
  };
}

// Basic health check
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    // Check database health
    const dbHealth = await databaseMonitor.getHealthStatus();

    const healthCheck: HealthCheck = {
      status: dbHealth.healthy ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env['NODE_ENV'] || 'development',
      checks: {
        database: dbHealth.healthy,
        // redis: await checkRedis(),
        // ai: await checkAIService(),
      },
    };

    const statusCode = dbHealth.healthy ? 200 : 503;
    res.status(statusCode).json(healthCheck);
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Service unavailable',
    });
  }
});

// Readiness probe (for Kubernetes/container orchestration)
router.get('/ready', async (_req: Request, res: Response): Promise<void> => {
  try {
    // Check critical dependencies
    const dbHealth = await databaseMonitor.isHealthy();

    if (!dbHealth) {
      res.status(503).json({ status: 'not ready', reason: 'database not healthy' });
      return;
    }

    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Readiness check failed:', error);
    res.status(503).json({
      status: 'not ready',
      error: 'Service not ready',
    });
  }
});

// Liveness probe (for Kubernetes/container orchestration)
router.get('/live', (_req: Request, res: Response): void => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
});

// Database health check with detailed metrics
router.get('/database', async (_req: Request, res: Response): Promise<void> => {
  try {
    const healthStatus = await databaseMonitor.getHealthStatus();

    res.status(healthStatus.healthy ? 200 : 503).json({
      status: healthStatus.status,
      timestamp: new Date().toISOString(),
      checks: healthStatus.checks,
      metrics: {
        connectionPool: healthStatus.metrics.connectionPool,
        performance: healthStatus.metrics.performance,
        errors: healthStatus.metrics.errors,
      },
    });
  } catch (error) {
    logger.error('Database health check failed:', error);
    res.status(503).json({
      status: 'critical',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    });
  }
});

export default router;
