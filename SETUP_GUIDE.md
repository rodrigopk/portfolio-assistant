# Setup Guide - DevPortfolio AI Backend

This guide will walk you through setting up the backend API for local development.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 20+** - [Download here](https://nodejs.org/)
- **npm 10+** - Comes with Node.js
- **PostgreSQL 15+** - [Download here](https://www.postgresql.org/download/)
- **Redis 7+** - [Download here](https://redis.io/download)
- **Git** - [Download here](https://git-scm.com/)

Optionally:

- **Docker & Docker Compose** - For containerized development

## Quick Start

### Option 1: Automated Setup (Recommended)

Run the setup script:

```bash
./setup.sh
```

This will:

- ✅ Verify Node.js and npm versions
- ✅ Create .env file from template
- ✅ Install all dependencies
- ✅ Set up Git hooks with Husky
- ✅ Create necessary directories

### Option 2: Manual Setup

#### Step 1: Install Dependencies

```bash
npm install
```

#### Step 2: Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Required
DATABASE_URL=postgresql://user:password@localhost:5432/portfolio
REDIS_URL=redis://localhost:6379
CLAUDE_API_KEY=sk-ant-...  # Get from https://console.anthropic.com

# Optional (for GitHub sync)
GITHUB_TOKEN=ghp_...
GITHUB_USERNAME=your_username
```

#### Step 3: Set Up Git Hooks

```bash
npx husky install
```

#### Step 4: Create Logs Directory

```bash
mkdir -p apps/api/logs
```

## Database Setup

### Using Docker (Recommended)

Create a `docker-compose.yml` file:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: portfolio
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'

volumes:
  postgres_data:
```

Start the services:

```bash
docker-compose up -d
```

### Manual Installation

1. **Install PostgreSQL**
   - macOS: `brew install postgresql@15`
   - Ubuntu: `sudo apt install postgresql-15`
   - Windows: Download from postgresql.org

2. **Create Database**

```bash
psql -U postgres
CREATE DATABASE portfolio;
CREATE USER user WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE portfolio TO user;
\q
```

3. **Install Redis**
   - macOS: `brew install redis && brew services start redis`
   - Ubuntu: `sudo apt install redis-server && sudo systemctl start redis`
   - Windows: Use WSL or download from redis.io

4. **Verify Redis is running**

```bash
redis-cli ping
# Should return: PONG
```

## Running the Application

### Development Mode

Start the API server with hot-reload:

```bash
npm run dev
```

The API will be available at `http://localhost:3001`

### Verify Installation

Check the health endpoint:

```bash
curl http://localhost:3001/api/health
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": "2025-10-28T...",
  "uptime": 1.234,
  "environment": "development",
  "checks": {}
}
```

## Development Workflow

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Linting and Formatting

```bash
# Check for linting errors
npm run lint

# Fix linting errors automatically
cd apps/api && npm run lint:fix

# Format code with Prettier
npm run format

# Check formatting without changing files
npm run format:check
```

### Building for Production

```bash
# Build all packages
npm run build

# Build only the API
cd apps/api && npm run build
```

### Type Checking

```bash
cd apps/api
npm run typecheck
```

## Troubleshooting

### Port Already in Use

If port 3001 is already in use, change it in `.env`:

```env
PORT=3002
```

### Database Connection Issues

1. Verify PostgreSQL is running:

```bash
# macOS/Linux
pg_isready

# Or check the service
sudo systemctl status postgresql  # Linux
brew services list | grep postgres  # macOS
```

2. Check your DATABASE_URL in `.env` matches your PostgreSQL configuration

3. Test the connection:

```bash
psql postgresql://user:password@localhost:5432/portfolio
```

### Redis Connection Issues

1. Verify Redis is running:

```bash
redis-cli ping
```

2. If not running:

```bash
# macOS
brew services start redis

# Linux
sudo systemctl start redis
```

### TypeScript Errors

If you see TypeScript errors:

1. Clear build cache:

```bash
npm run clean
```

2. Reinstall dependencies:

```bash
rm -rf node_modules package-lock.json
npm install
```

3. Rebuild:

```bash
npm run build
```

### Husky Hook Failures

If Git hooks are failing:

1. Reinstall Husky:

```bash
npm run prepare
```

2. Make hooks executable:

```bash
chmod +x .husky/pre-commit
```

## IDE Setup

### VS Code (Recommended)

Install recommended extensions:

- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- Error Lens

Create `.vscode/settings.json`:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

## Next Steps

1. ✅ **Database Schema**: Set up Prisma and create database schema
2. ✅ **Authentication**: Implement JWT authentication
3. ✅ **API Routes**: Add profile, projects, and chat endpoints
4. ✅ **AI Integration**: Set up Mastra AI agents
5. ✅ **Tests**: Write comprehensive tests for all endpoints

## Getting Help

- 📖 See [README.md](README.md) for project overview
- 📚 See [Technical Documentation](docs/TECHNICAL_DOCUMENTATION.md) for detailed specs
- 💬 Create an issue on GitHub for bugs or questions
- 📧 Contact: rodrigo@example.com

## Useful Commands Reference

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Build for production
npm start                      # Start production server (after build)

# Testing
npm test                       # Run tests
npm run test:watch            # Watch mode
npm run test:coverage         # With coverage

# Code Quality
npm run lint                   # Lint all packages
npm run format                 # Format all code
npm run typecheck              # Type check (from apps/api)

# Database (Coming Soon)
npm run db:migrate            # Run migrations
npm run db:seed               # Seed database
npm run db:studio             # Open Prisma Studio

# Cleanup
npm run clean                  # Clean build artifacts
rm -rf node_modules           # Remove all dependencies
```

---

**Ready to code?** Start the development server with `npm run dev` and visit `http://localhost:3001/api/health`! 🚀
