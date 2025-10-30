# Claude Code Quick Reference - DevPortfolio AI

Quick copy-paste prompts for common tasks. See `CLAUDE_CODE_PROMPT_GUIDE.md` for detailed examples.

---

## 🚀 Getting Started

### Initialize Backend

```
According to TECHNICAL_DOCUMENTATION.md section 7.5, please initialize the backend project in apps/api/ with:
- Node.js 20+ and Express.js with TypeScript
- All dependencies from section 1.3 (Express, Prisma, Redis client, etc.)
- ESLint, Prettier, and Husky from section 7.4
- tsconfig.json with strict mode (section 7.4.1)
- .env.example with variables from section 7.1.3
- Basic Express server structure
- npm scripts: dev, build, test, lint

Create all necessary files and explain the structure.
```

### Initialize Database

```
Following TECHNICAL_DOCUMENTATION.md section 4, set up Prisma:
- Initialize in packages/database/
- Create complete schema from section 4.2 (all 11 models)
- Set up migrations (section 4.4.1)
- Create seed file from section 4.4.3
- Add npm scripts: db:migrate, db:seed, db:push
- Generate Prisma Client

Verify schema matches documentation exactly.
```

### Initialize Frontend

```
Following TECHNICAL_DOCUMENTATION.md, create the React frontend in apps/web/:
- Vite + React 18+ + TypeScript
- TailwindCSS with breakpoints from section 6.6.1
- React Router with routes from section 6.3
- React Query with config from section 6.2.1
- Component structure from section 6.1 (folders only)
- ESLint and Prettier from section 7.4
- Basic Layout component (Header, Main, Footer)

Create a working app that renders layout and routing.
```

---

## 🔨 Backend Endpoints

### Simple Endpoint (Profile)

```
Implement GET /api/profile per TECHNICAL_DOCUMENTATION.md section 5.1.1:
- Exact response schema from docs
- Redis caching (60 min TTL)
- Prisma query for Profile model
- TypeScript types
- Error handling (section 5.5)
- Rate limiting (section 5.4)
- Unit tests with Vitest (80%+ coverage)
- Integration tests with Supertest

File structure:
- apps/api/src/routes/profile.ts
- apps/api/src/controllers/profile.controller.ts
- apps/api/src/services/profile.service.ts
- apps/api/src/__tests__/profile.test.ts
```

### Complex Endpoint (Projects)

```
Implement project endpoints per section 5.1.2:
- GET /api/projects (with filtering, pagination)
- GET /api/projects/:slug
- All query parameters from docs
- Caching (30 min)
- Prisma with Project model
- Exact response schemas
- Zod validation
- Comprehensive tests
- 404 handling for invalid slugs

Clean service layer: routes → controllers → services
```

### WebSocket Endpoint

```
Implement chat WebSocket per sections 5.1.3 and 5.2:
- WebSocket server setup
- Message types from section 5.2.2
- Session management
- Rate limiting (20 req/10 min/session)
- Error handling and reconnection
- Integration tests
- TypeScript types for all messages

Files:
- apps/api/src/websocket/chat.handler.ts
- apps/api/src/websocket/session.manager.ts
- apps/api/src/__tests__/websocket.test.ts

Use mock responses for now (AI agent later).
```

---

## 🎨 Frontend Components

### Page with Data Fetching

```
Implement Projects page per section 6.1:
- Projects page with ProjectGrid and ProjectFilters
- useProjects hook (section 6.2.1)
- Filtering (category, tech, featured)
- Pagination
- ProjectCard component
- Loading and error states
- Responsive design (section 6.6, mobile-first)
- Accessibility (section 6.5)
- TailwindCSS styling

Components:
- apps/web/src/pages/Projects.tsx
- apps/web/src/components/ProjectGrid.tsx
- apps/web/src/components/ProjectCard.tsx
- apps/web/src/components/ProjectFilters.tsx
- apps/web/src/hooks/useProjects.ts
```

### Complex Widget (Chat)

```
Create ChatWidget per section 6.1:
- ChatButton, ChatWindow, MessageList, MessageInput
- WebSocket connection (section 5.2)
- ChatContext from section 6.2.2
- Message streaming
- SuggestedQuestions component
- Lazy loading (section 6.4.1)
- Accessibility (keyboard nav, ARIA)
- TailwindCSS + Framer Motion
- Error handling and reconnection

Create:
- apps/web/src/widgets/ChatWidget/
- apps/web/src/contexts/ChatContext.tsx
- apps/web/src/hooks/useChat.ts
```

---

## 🤖 AI Agents

### Chat Agent with Mastra

```
Implement Chat Agent per section 3.2:
- Create packages/agents/ workspace
- Install Mastra + Anthropic SDK
- Implement agent from section 3.2.5
- Function tools from section 3.2.3:
  * searchProjects
  * getProjectDetails
  * searchBlogPosts
  * checkAvailability
  * suggestProposal
- System prompt from section 3.2.2
- Conversation history (PostgreSQL, last 10 messages)
- Error handling (section 3.8)
- Unit tests for each tool

Structure:
- packages/agents/src/chat-agent.ts
- packages/agents/src/tools/
- packages/agents/src/__tests__/

Integrate with WebSocket handler.
```

### RAG System

```
Implement RAG per section 3.7:
- PostgreSQL with pgvector OR Pinecone
- Embedding generation service
- Vector DB setup (section 3.7.1):
  * Chunk content (500 tokens, 50 overlap)
  * Embed projects, blog posts, skills
  * Store with metadata
- Retrieval strategy (section 3.7.2)
- Context injection (section 3.7.3)
- Add as tool to Chat Agent
- Tests for semantic search (<200ms)

Files:
- packages/agents/src/rag/vector-store.ts
- packages/agents/src/rag/embeddings.ts
- packages/agents/src/rag/retrieval.ts
```

---

## 🧪 Testing & Quality

### Test Infrastructure

```
Set up testing per section 7.3:
- Install Vitest, React Testing Library, Supertest
- Configure Vitest (80%+ coverage target)
- Test database setup
- Test utilities and mocks
- Test scripts in package.json
- CI setup (section 8.3.1)
- Example tests:
  * Unit test (section 7.3.2)
  * Integration test (API)
  * Component test (React)

Files:
- vitest.config.ts
- apps/api/src/__tests__/setup.ts
- apps/web/src/__tests__/setup.ts
- .github/workflows/ci.yml
```

### Linting Setup

```
Set up code quality per section 7.4:
- ESLint with TypeScript (section 7.4.2)
- Prettier
- Husky pre-commit hooks
- lint-staged
- Commitlint (section 7.4.3)
- npm scripts: lint, format, type-check
- Add to CI pipeline
- .editorconfig

Block commits if:
- Linting fails
- Tests fail
- Types fail
- Formatting wrong
```

---

## 🔐 Security & Monitoring

### Security Features

```
Implement security per section 9:
- JWT authentication (section 9.1)
- Zod validation for all endpoints (section 9.2)
- Rate limiting (section 9.3)
- CORS whitelist (section 9.3)
- CSP headers (section 9.4)
- Secure cookies (section 9.4)
- AI input sanitization (section 9.6)
- Dependency scanning
- Security middleware
- Security tests
```

### Monitoring Stack

```
Implement monitoring per section 10:
- Winston structured logging (section 10.1)
- Sentry error tracking (section 10.2)
- Performance monitoring (section 10.3):
  * API response times
  * Database queries
  * AI API latency
  * Cache hit/miss rates
- Analytics (section 10.4)
- Health check endpoint (section 10.5)
- Request/response logging middleware
- Alert setup

Log all AI interactions with costs/tokens/latency.
```

---

## ✅ Verification Commands

### Verify Implementation

```
Verify this matches TECHNICAL_DOCUMENTATION.md section [X.X]:
1. API contract (request/response format)
2. Error handling
3. Rate limiting
4. Caching strategy
5. TypeScript types
6. Test coverage

List any discrepancies.
```

### Run Tests

```
Run all tests and report:
1. Test results (pass/fail)
2. Coverage percentage
3. Any warnings or errors
4. Suggestions for additional tests
```

### Code Quality Check

```
Review against section 7.4 code style guidelines:
1. ESLint compliance
2. TypeScript strict mode
3. Naming conventions
4. Code organization
5. Comments and documentation

Fix any issues found.
```

---

## 🔧 Troubleshooting

### Debug Implementation

```
Implementation isn't working. Please:
1. Review section [X.X] of TECHNICAL_DOCUMENTATION.md
2. Compare implementation to specification
3. Identify differences
4. Fix issues
5. Explain what was wrong and the fix
```

### Debug Tests

```
Tests are failing. Please:
1. Run tests and show output
2. Identify failing test and reason
3. Fix the issue
4. Verify all tests pass
5. Check coverage still >80%
```

---

## 📋 Template Prompts

### For Any Feature

```
According to TECHNICAL_DOCUMENTATION.md section [X.X], implement [FEATURE]:

Requirements:
1. [Specific requirement from docs]
2. [Another requirement]
3. Include comprehensive tests (80%+ coverage)
4. Add TypeScript types
5. Add error handling per section 5.5
6. Follow code style from section 7.4
7. [Any other specific needs]

File structure:
- [List expected files]

Verify against documentation when complete.
```

### For Bug Fixes

```
There's a bug in [FEATURE]. According to section [X.X], it should [EXPECTED BEHAVIOR] but instead [ACTUAL BEHAVIOR].

Please:
1. Identify the root cause
2. Fix the issue following the spec
3. Add tests to prevent regression
4. Verify all existing tests still pass
5. Explain what was wrong
```

---

## 💡 Pro Tips

1. **Always reference section numbers**: "per section 3.2.5" not "in the docs"
2. **Be specific about tests**: Request exact coverage targets
3. **Ask for verification**: "Verify this matches the docs exactly"
4. **Iterate**: Skeleton → Implementation → Tests → Polish
5. **Use TypeScript**: Always ask for proper types
6. **Request explanations**: "Explain how this implements the spec"

---

## 🎯 Recommended Order

1. ✅ Backend structure (Prompt: Initialize Backend)
2. ✅ Database (Prompt: Initialize Database)
3. ✅ Simple API endpoint (Prompt: Simple Endpoint)
4. ✅ Test infrastructure (Prompt: Test Infrastructure)
5. ✅ Frontend structure (Prompt: Initialize Frontend)
6. ✅ Simple page (Prompt: Page with Data Fetching)
7. ✅ WebSocket (Prompt: WebSocket Endpoint)
8. ✅ Chat Agent (Prompt: Chat Agent with Mastra)
9. ✅ RAG (Prompt: RAG System)
10. ✅ Security (Prompt: Security Features)
11. ✅ Monitoring (Prompt: Monitoring Stack)

---

**Remember**: The `TECHNICAL_DOCUMENTATION.md` is your single source of truth. Always reference it explicitly in your prompts!
