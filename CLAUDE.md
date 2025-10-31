# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DevPortfolio AI is an AI-powered portfolio website built as a Turborepo monorepo. The project consists of:

- **apps/api**: Express.js backend API with TypeScript, Prisma ORM, Redis caching, and WebSocket support
- **apps/web**: React 18 frontend with Vite, TailwindCSS, and React Query
- **Mastra AI Integration**: AI agent framework for chat, proposals, and cost estimation (planned)

Technology requirements: Node.js 20+, PostgreSQL 15+, Redis 7+

## Development Commands

### Root Level (Turborepo)

```bash
npm run dev           # Start all apps in dev mode (API on :3001, web on :5173)
npm run build         # Build all applications
npm test              # Run all tests across workspaces
npm run lint          # Lint all packages
npm run format        # Format with Prettier
npm run format:check  # Check formatting without writing
npm run clean         # Clean all build artifacts
```

### API Specific (apps/api)

```bash
cd apps/api
npm run dev           # Start API dev server with tsx watch
npm run build         # Compile TypeScript to dist/
npm test              # Run Vitest tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
npm run lint          # Run ESLint
npm run lint:fix      # Auto-fix linting issues
npm run typecheck     # Type check without emitting files
```

**Testing Individual Files:**

```bash
# From apps/api directory
npm test -- src/__tests__/profile.test.ts
npm test -- src/__tests__/project.test.ts
```

### Web App Specific (apps/web)

```bash
cd apps/web
npm run dev           # Start Vite dev server on :5173
npm run build         # Build for production
npm test              # Run Vitest tests
npm run lint          # Run ESLint
npm run lint:fix      # Auto-fix linting issues
npm run type-check    # TypeScript type checking
npm run preview       # Preview production build
```

### Prisma Database Commands

```bash
cd apps/api
npx prisma generate   # Generate Prisma Client
npx prisma migrate dev --name <name>  # Create and apply migration
npx prisma db push    # Push schema without migration (dev only)
npx prisma db seed    # Seed database with test data
npx prisma studio     # Open Prisma Studio GUI
```

## Architecture Overview

### Backend Structure (apps/api/src/)

```
src/
├── index.ts           # Server entry point (Redis, WebSocket, graceful shutdown)
├── app.ts             # Express app setup (middleware, CORS, routes)
├── routes/            # Route handlers (health, profile, projects)
├── controllers/       # Business logic controllers
├── services/          # Service layer (profile.service, project.service)
├── middleware/        # Express middleware (errorHandler, rateLimiter, etc.)
├── websocket/         # WebSocket handlers (chat.handler)
├── lib/               # Shared libraries (redis.ts)
├── utils/             # Utilities (logger)
├── types/             # TypeScript type definitions
└── __tests__/         # Vitest test files
```

**Key Patterns:**

- **Service Layer**: Business logic lives in `services/` (e.g., `profile.service.ts`, `project.service.ts`)
- **Controllers**: Handle HTTP request/response in `controllers/`
- **Redis Caching**: Use `cache.get()`, `cache.set()`, `cache.del()` from `lib/redis.ts`
- **WebSocket**: Chat functionality via `websocket/chat.handler.ts`
- **Error Handling**: Centralized in `middleware/errorHandler.ts`

### Frontend Structure (apps/web/src/)

```
src/
├── main.tsx           # App entry point
├── App.tsx            # Root component with routing
├── components/
│   ├── layout/        # Header, Footer, Layout
│   ├── pages/         # Page components (Home, Projects, Blog, etc.)
│   ├── ProjectCard.tsx
│   ├── ProjectGrid.tsx
│   └── ProjectFilters.tsx
├── hooks/             # Custom React hooks
├── lib/               # Libraries (queryClient)
└── types/             # TypeScript types
```

**Key Patterns:**

- **Routing**: React Router v7 with nested routes in `App.tsx`
- **Data Fetching**: React Query (`@tanstack/react-query`) for server state
- **Styling**: TailwindCSS v4
- **Animations**: Framer Motion for transitions

### Database Schema (Prisma)

Located in `apps/api/prisma/schema.prisma`:

- **Profile**: Single profile with contact info, bio, availability, hourly rate
- **Project**: Projects with slug, technologies (string array), GitHub integration fields (stars, forks, lastCommit)

Indexes on: `featured + order`, `category`, `slug`

## Code Style & Standards

### TypeScript Configuration

- **Strict mode enabled**: All strict checks on (`strict: true`)
- **No implicit any**: Explicit typing required
- **Unused variables**: Prefix with `_` if intentionally unused
- **Module resolution**: CommonJS for API, ES modules for web

### ESLint Rules (apps/api)

- **Naming conventions**:
  - `camelCase` for variables, functions, parameters
  - `PascalCase` for types, interfaces, classes
  - `UPPER_CASE` for constants and enum members
- **Import organization**: Builtin → External → Internal → Parent → Sibling, alphabetically sorted with newlines between groups
- **No `console.log`**: Use `logger` from `utils/logger.ts` (winston) instead
- **No `any` type**: Explicit types required

### Commit Message Format

Follow Conventional Commits:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

### Git Hooks (Husky)

Pre-commit hook runs `lint-staged`:

- Formats JSON and Markdown files with Prettier
- Runs ESLint on staged TypeScript files
- Validates commit message format

## Testing Strategy

### API Tests (Vitest)

Located in `apps/api/src/__tests__/`:

- `profile.test.ts` - Profile endpoint tests
- `project.test.ts` - Project CRUD and filtering tests
- `websocket.test.ts` - WebSocket chat handler tests
- `cors.test.ts` - CORS configuration tests

**Test utilities**: Use `supertest` for HTTP requests, mock Redis and Prisma clients where needed.

### Coverage Reports

```bash
npm run test:coverage  # Generates coverage report in coverage/
```

Coverage thresholds and reporters configured in `vitest.config.ts`.

## Environment Variables

Key variables (see `.env.example` for complete list):

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/portfolio

# Redis
REDIS_URL=redis://localhost:6379

# Server
PORT=3001
HOST=localhost
NODE_ENV=development

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# AI (future use)
CLAUDE_API_KEY=your_anthropic_api_key
GITHUB_TOKEN=your_github_token
GITHUB_USERNAME=your_username
```

## CI/CD Pipeline

GitHub Actions workflow (`.github/workflows/ci.yml`):

1. Sets up PostgreSQL service
2. Installs dependencies with `npm ci`
3. Generates Prisma Client
4. Runs linting, tests, and builds

Triggers on PRs to `main` and `develop` branches.

## Common Development Workflows

### Adding a New API Endpoint

1. Define route in `apps/api/src/routes/<resource>.ts`
2. Create controller in `apps/api/src/controllers/<resource>.controller.ts`
3. Implement service logic in `apps/api/src/services/<resource>.service.ts`
4. Add types to `apps/api/src/types/<resource>.types.ts`
5. Write tests in `apps/api/src/__tests__/<resource>.test.ts`
6. Import route into `apps/api/src/routes/index.ts`

### Adding a Database Model

1. Update `apps/api/prisma/schema.prisma`
2. Run `npx prisma migrate dev --name <descriptive-name>`
3. Update seed file if needed (`apps/api/prisma/seed.ts`)
4. Generate types: `npx prisma generate`

### Adding a React Component

1. Create component in `apps/web/src/components/<name>/`
2. Use TypeScript for all props interfaces
3. Apply TailwindCSS for styling
4. Export from component directory's index file if grouping related components
5. Add tests in `__tests__/` subdirectory

### Working with Redis Cache

```typescript
import { cache } from '@/lib/redis';

// Get cached data
const data = await cache.get<MyType>('cache-key');

// Set with 1 hour TTL
await cache.set('cache-key', data, 3600);

// Delete cache
await cache.del('cache-key');

// Delete pattern (e.g., all project caches)
await cache.delPattern('projects:*');
```

## Important Implementation Details

### CORS Configuration

CORS allows specific origins from `ALLOWED_ORIGINS` env var. Defaults to localhost:3000, 5173, and 4173. Requests with no origin (Postman, mobile apps) are allowed.

### Rate Limiting

Global rate limiter middleware (`middleware/rateLimiter.ts`) protects all endpoints.

### WebSocket Chat

WebSocket server runs on `/ws` path. Handler in `websocket/chat.handler.ts` manages connections and message routing.

### Graceful Shutdown

Server handles SIGTERM/SIGINT signals to:

1. Clean up WebSocket connections
2. Disconnect Redis
3. Close HTTP server
4. Force exit after 10s timeout

### Service Layer Pattern

Services handle business logic and external integrations (database, cache, GitHub API). Controllers remain thin and focused on HTTP concerns.

## Documentation References

- Technical specification: `docs/TECHNICAL_DOCUMENTATION.md`
- Reference materials: `docs/REFERENCE_DOCUMENTATION.md`
- Setup guide: `SETUP_GUIDE.md`
- Profile API testing: `PROFILE_API_TESTING.md`
- Project endpoints: `PROJECT_ENDPOINTS_IMPLEMENTATION.md`
