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
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const healthCheck: HealthCheck = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      checks: {
        // TODO: Add actual health checks for dependencies
        // database: await checkDatabase(),
        // redis: await checkRedis(),
        // ai: await checkAIService(),
      },
    };

    res.status(200).json(healthCheck);
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
router.get('/ready', async (req: Request, res: Response): Promise<void> => {
  try {
    // TODO: Add checks for critical dependencies
    // const databaseReady = await checkDatabase();
    // const redisReady = await checkRedis();

    // if (!databaseReady || !redisReady) {
    //   res.status(503).json({ status: 'not ready' });
    //   return;
    // }

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
router.get('/live', (req: Request, res: Response): void => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
});

export default router;
