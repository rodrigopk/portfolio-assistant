import compression from 'compression';
import cors from 'cors';
import express, { Application } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { requestLogger } from './middleware/requestLogger';
import router from './routes';
import { logger } from './utils/logger';

const app: Application = express();

// Security middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = process.env['ALLOWED_ORIGINS']?.split(',') || ['http://localhost:3000'];
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Request logging
if (process.env['NODE_ENV'] === 'development') {
  app.use(morgan('dev'));
}
app.use(requestLogger);

// Rate limiting
app.use(rateLimiter);

// API routes
app.use('/api', router);

// 404 handler
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

logger.info('Express app initialized');

export default app;
