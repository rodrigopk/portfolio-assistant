# DevPortfolio AI - Backend API

Backend API for the DevPortfolio AI application, built with Node.js, Express, and TypeScript.

## Features

- **Express.js** - Fast, unopinionated web framework
- **TypeScript** - Type-safe development with strict mode enabled
- **Prisma ORM** - Modern database ORM with type safety
- **Mastra AI** - AI agent orchestration framework
- **Winston** - Advanced logging
- **Rate Limiting** - Built-in rate limiting for API protection
- **Security** - Helmet, CORS, and other security middleware
- **Testing** - Vitest for fast unit and integration tests
- **Hot Reload** - Development with tsx watch mode

## Directory Structure

```
apps/api/
├── src/
│   ├── routes/          # API route handlers
│   ├── middleware/      # Express middleware
│   ├── services/        # Business logic services
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   ├── app.ts           # Express app configuration
│   └── index.ts         # Application entry point
├── tests/               # Test files
├── logs/                # Application logs
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL 15+
- Redis 7+

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp ../../.env.example ../../.env
# Edit .env with your configuration
```

3. Start development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3001`

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run lint` - Lint code with ESLint
- `npm run lint:fix` - Fix linting errors
- `npm run typecheck` - Check TypeScript types

## API Endpoints

### Health Check

- `GET /api/health` - General health check
- `GET /api/health/ready` - Readiness probe
- `GET /api/health/live` - Liveness probe

### Coming Soon

- `GET /api/profile` - Get portfolio profile
- `GET /api/projects` - List projects
- `POST /api/chat` - Chat with AI assistant
- `POST /api/proposals/generate` - Generate project proposal
- `GET /api/blog` - List blog posts

## Environment Variables

See `.env.example` in the project root for all available environment variables.

Key variables:
- `PORT` - Server port (default: 3001)
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `CLAUDE_API_KEY` - Anthropic Claude API key
- `GITHUB_TOKEN` - GitHub personal access token

## Development

### Adding a New Route

1. Create a route file in `src/routes/`:
```typescript
import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  res.json({ message: 'Hello World' });
});

export default router;
```

2. Register the route in `src/routes/index.ts`:
```typescript
import myRouter from './myroute';
router.use('/myroute', myRouter);
```

### Adding Middleware

Create middleware in `src/middleware/`:
```typescript
import { Request, Response, NextFunction } from 'express';

export const myMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Your middleware logic
  next();
};
```

### Error Handling

Use the `AppError` class for consistent error handling:
```typescript
import { AppError } from '@/middleware/errorHandler';

throw new AppError('Something went wrong', 400, 'BAD_REQUEST');
```

For async route handlers, use `asyncHandler`:
```typescript
import { asyncHandler } from '@/utils/asyncHandler';

router.get('/data', asyncHandler(async (req, res) => {
  const data = await fetchData();
  res.json(data);
}));
```

## Testing

Run tests with:
```bash
npm test
```

Example test:
```typescript
import { describe, it, expect } from 'vitest';

describe('My Feature', () => {
  it('should work correctly', () => {
    expect(1 + 1).toBe(2);
  });
});
```

## Logging

The application uses Winston for logging. Logs are written to:
- `logs/error.log` - Error level logs
- `logs/combined.log` - All logs
- Console - Development mode

Example usage:
```typescript
import { logger } from '@/utils/logger';

logger.info('Something happened');
logger.error('An error occurred', { error });
```

## Security

The API includes several security features:
- Helmet.js for security headers
- CORS configuration
- Rate limiting
- Input validation with Zod (to be added)
- JWT authentication (to be added)

## Production Deployment

1. Build the application:
```bash
npm run build
```

2. Set environment to production:
```bash
export NODE_ENV=production
```

3. Start the server:
```bash
npm start
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License

MIT
