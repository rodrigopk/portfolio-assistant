# Claude Code Prompt Guide for DevPortfolio AI

This guide provides example prompts for using Claude Code to implement features from the TECHNICAL_DOCUMENTATION.md file.

---

## Table of Contents

1. [General Principles](#general-principles)
2. [Initial Setup Prompts](#initial-setup-prompts)
3. [Backend Implementation Prompts](#backend-implementation-prompts)
4. [Frontend Implementation Prompts](#frontend-implementation-prompts)
5. [AI Agent Implementation Prompts](#ai-agent-implementation-prompts)
6. [Testing & Quality Prompts](#testing--quality-prompts)
7. [Advanced Implementation Prompts](#advanced-implementation-prompts)

---

## General Principles

### How to Reference the Documentation

Claude Code will automatically have access to `TECHNICAL_DOCUMENTATION.md` in your repository. Reference it explicitly in your prompts:

**Good Prompt Structure:**
```
According to TECHNICAL_DOCUMENTATION.md section [X.X], please implement [feature].

Requirements:
- Follow the exact specifications in the documentation
- Include tests as described
- Add proper error handling
- Follow the code style guidelines from section 7.4
```

### Key Tips

1. **Be specific about sections**: Reference exact section numbers (e.g., "5.1.1", "3.2.5")
2. **Specify what to include**: tests, linting, types, error handling, etc.
3. **Request adherence to standards**: mention following the tech stack and patterns from the docs
4. **Ask for verification**: request that Claude verify against the documentation
5. **Iterative approach**: start with foundation, then build incrementally

---

## Initial Setup Prompts

### 1. Initialize Backend Project

```
Please initialize the backend project following the specifications in TECHNICAL_DOCUMENTATION.md.

Requirements:
1. Create the monorepo structure as shown in section 7.5
2. Set up the backend in apps/api/ with TypeScript, Express.js, and Node.js 20+
3. Configure all the tools mentioned in section 7.4 (ESLint, Prettier, Husky)
4. Create package.json with all dependencies from section 1.3
5. Set up tsconfig.json with strict mode as specified in section 7.4.1
6. Create .env.example with all environment variables from section 7.1.3
7. Set up the basic Express server structure
8. Add npm scripts for dev, build, test, and lint

Please create all necessary files and explain the structure you've created.
```

### 2. Initialize Database with Prisma

```
Based on TECHNICAL_DOCUMENTATION.md section 4, please set up the database layer:

1. Install Prisma and its dependencies
2. Initialize Prisma in packages/database/
3. Create the complete schema from section 4.2 in prisma/schema.prisma
4. Set up the migration infrastructure from section 4.4.1
5. Create the seed file from section 4.4.3 with the example data for Rodrigo's profile
6. Add npm scripts for migrations (db:migrate, db:seed, db:push)
7. Generate Prisma Client

Verify that the schema matches all 11 models exactly as specified in the documentation.
```

### 3. Set Up Docker Environment

```
According to TECHNICAL_DOCUMENTATION.md section 8.2, please create the Docker development environment:

1. Create docker/api.Dockerfile following section 8.2.2
2. Create docker-compose.yml following section 8.2.3
3. Include PostgreSQL and Redis services
4. Configure proper environment variables
5. Set up volume mounts for hot reload
6. Add a README section explaining how to use Docker for local development

Make sure the configuration supports hot reload during development.
```

---

## Backend Implementation Prompts

### 4. Implement Profile API Endpoint

```
Please implement the GET /api/profile endpoint as specified in TECHNICAL_DOCUMENTATION.md section 5.1.1.

Requirements:
1. Follow the exact response schema from section 5.1.1
2. Implement Redis caching (60 minutes TTL) as specified in section 2.3.1
3. Use Prisma to query the Profile model from section 4.2
4. Add proper TypeScript types
5. Include error handling following section 5.5
6. Add rate limiting per section 5.4
7. Create unit tests with Vitest (80%+ coverage)
8. Create integration tests using Supertest
9. Follow the code style guidelines from section 7.4

File structure:
- apps/api/src/routes/profile.ts
- apps/api/src/controllers/profile.controller.ts
- apps/api/src/services/profile.service.ts
- apps/api/src/__tests__/profile.test.ts

Please also update the main Express app to register this route.
```

### 5. Implement Projects API Endpoints

```
According to TECHNICAL_DOCUMENTATION.md section 5.1.2, implement both project endpoints:

1. GET /api/projects (with all query parameters)
2. GET /api/projects/:slug

Requirements:
- Implement filtering by featured, category, and technologies
- Add pagination with limit and offset
- Implement caching (30 minutes) as per section 2.3.1
- Use Prisma with the Project model from section 4.2
- Return exact response schemas from section 5.1.2
- Add comprehensive tests for all query parameter combinations
- Include error handling for invalid slugs (404)
- Add input validation using Zod
- Follow rate limiting from section 5.4

Create a clean service layer architecture separating routes, controllers, and services.
```

### 6. Implement Chat WebSocket Endpoint

```
Based on TECHNICAL_DOCUMENTATION.md sections 5.1.3 and 5.2, implement the chat WebSocket functionality:

1. Set up WebSocket server using ws library
2. Implement the message types from section 5.2.2
3. Add session management and authentication
4. Implement rate limiting (20 requests per 10 minutes per session) from section 5.4
5. Add proper error handling and reconnection logic
6. Create integration tests for WebSocket communication
7. Add TypeScript types for all message formats

Structure:
- apps/api/src/websocket/chat.handler.ts
- apps/api/src/websocket/session.manager.ts
- apps/api/src/__tests__/websocket.test.ts

For now, create a mock response handler - we'll integrate the Mastra agent in a later step.
```

---

## Frontend Implementation Prompts

### 7. Initialize Frontend Project

```
Following TECHNICAL_DOCUMENTATION.md, initialize the React frontend:

1. Create apps/web/ with Vite, React 18+, and TypeScript
2. Install dependencies: TailwindCSS, React Router, React Query, Framer Motion (from section 1.3)
3. Set up TailwindCSS configuration with the breakpoints from section 6.6.1
4. Create the component hierarchy structure from section 6.1 (just folders and placeholder components)
5. Set up React Router with routes from section 6.3
6. Configure React Query provider with settings from section 6.2.1
7. Create the Layout component structure (Header, Main, Footer)
8. Set up environment variables from section 7.1.3
9. Add ESLint and Prettier configuration from section 7.4

Create a basic working app that renders the layout and routing structure.
```

### 8. Implement Projects List Page

```
According to TECHNICAL_DOCUMENTATION.md section 6.1, implement the Projects page:

1. Create the Projects page component with ProjectGrid and ProjectFilters
2. Implement the useProjects hook from section 6.2.1
3. Add filtering functionality (category, technologies, featured)
4. Implement pagination
5. Create the ProjectCard component with proper styling
6. Add loading states and error handling
7. Implement responsive design per section 6.6 (mobile-first)
8. Add accessibility features from section 6.5
9. Use TailwindCSS for styling

Components to create:
- apps/web/src/pages/Projects.tsx
- apps/web/src/components/ProjectGrid.tsx
- apps/web/src/components/ProjectCard.tsx
- apps/web/src/components/ProjectFilters.tsx
- apps/web/src/hooks/useProjects.ts

Follow the component hierarchy exactly as shown in the documentation.
```

### 9. Implement Chat Widget

```
Based on TECHNICAL_DOCUMENTATION.md section 6.1, create the ChatWidget:

1. Implement the ChatWidget with ChatButton, ChatWindow, MessageList, and MessageInput
2. Set up WebSocket connection using the API from section 5.2
3. Create ChatContext from section 6.2.2 for state management
4. Implement message streaming display
5. Add SuggestedQuestions component
6. Lazy load the component as shown in section 6.4.1
7. Add proper accessibility (keyboard navigation, ARIA labels)
8. Style with TailwindCSS, make it responsive
9. Add animations with Framer Motion
10. Handle connection errors and reconnection

Create:
- apps/web/src/widgets/ChatWidget/
- apps/web/src/contexts/ChatContext.tsx
- apps/web/src/hooks/useChat.ts

Include loading states, error states, and typing indicators.
```

---

## AI Agent Implementation Prompts

### 10. Implement Chat Agent with Mastra

```
Following TECHNICAL_DOCUMENTATION.md section 3.2, implement the Chat Agent:

1. Create packages/agents/ workspace
2. Install Mastra framework and Anthropic SDK
3. Implement the Chat Agent exactly as shown in section 3.2.5
4. Create all function tools from section 3.2.3:
   - searchProjects
   - getProjectDetails
   - searchBlogPosts
   - checkAvailability
   - suggestProposal
5. Implement the system prompt from section 3.2.2
6. Set up conversation history storage in PostgreSQL (section 3.2.4)
7. Add context management (last 10 messages)
8. Create proper TypeScript types for all functions
9. Add error handling and fallbacks from section 3.8
10. Write unit tests for each function tool

Structure:
- packages/agents/src/chat-agent.ts
- packages/agents/src/tools/
- packages/agents/src/__tests__/

Integrate this with the WebSocket handler created earlier.
```

### 11. Implement RAG System

```
According to TECHNICAL_DOCUMENTATION.md section 3.7, implement the RAG system:

1. Set up PostgreSQL with pgvector extension OR Pinecone
2. Create embedding generation service
3. Implement the vector database setup from section 3.7.1:
   - Chunk portfolio content (500 tokens, 50 overlap)
   - Generate embeddings for all projects, blog posts, and skills
   - Store in vector database with metadata
4. Implement retrieval strategy from section 3.7.2
5. Create context injection function from section 3.7.3
6. Add this to the Chat Agent as a tool
7. Write tests for semantic search functionality

Files:
- packages/agents/src/rag/vector-store.ts
- packages/agents/src/rag/embeddings.ts
- packages/agents/src/rag/retrieval.ts

Ensure the retrieval is fast (<200ms) and relevant.
```

### 12. Implement Proposal Generator Agent

```
Based on TECHNICAL_DOCUMENTATION.md section 3.3, create the Proposal Generator Agent:

1. Implement the multi-step workflow from section 3.3.1
2. Use the prompt engineering strategy from section 3.3.2
3. Follow the implementation pattern from section 3.3.3
4. Create each workflow step as a separate function:
   - extractRequirements
   - matchProjects
   - estimateTimeline
   - generateProposal
5. Implement proposal storage in the Proposal model
6. Add rate limiting (5 requests per hour per IP)
7. Create email notification using SendGrid
8. Write comprehensive tests for each step
9. Add human review workflow

Integrate with the API endpoint from section 5.1.4.
```

---

## Testing & Quality Prompts

### 13. Set Up Testing Infrastructure

```
According to TECHNICAL_DOCUMENTATION.md section 7.3, set up comprehensive testing:

1. Install Vitest, React Testing Library, and Supertest
2. Configure Vitest with coverage reporting (80%+ target from section 7.3)
3. Set up test database for integration tests
4. Create test utilities and mocks
5. Add test scripts to package.json
6. Set up GitHub Actions CI from section 8.3.1 to run tests
7. Create example tests for:
   - Unit test (section 7.3.2)
   - Integration test (API endpoint)
   - Component test (React component)

Files:
- vitest.config.ts
- apps/api/src/__tests__/setup.ts
- apps/web/src/__tests__/setup.ts
- .github/workflows/ci.yml

Ensure tests can run in isolation and in parallel.
```

### 14. Add Linting and Code Quality

```
Following TECHNICAL_DOCUMENTATION.md sections 7.4, set up code quality tools:

1. Configure ESLint with TypeScript rules from section 7.4.2
2. Set up Prettier for code formatting
3. Install and configure Husky for pre-commit hooks
4. Set up lint-staged to run linters on staged files
5. Add Commitlint for conventional commits (section 7.4.3)
6. Create npm scripts: lint, format, type-check
7. Add these checks to the CI pipeline
8. Create a .editorconfig file

Ensure that code cannot be committed if:
- Linting fails
- Tests fail
- Types don't check
- Formatting is incorrect
```

---

## Advanced Implementation Prompts

### 15. Implement GitHub Sync Job

```
Based on TECHNICAL_DOCUMENTATION.md section 3.4, create the GitHub sync functionality:

1. Install Bull for job queues
2. Set up Redis connection for Bull
3. Create the GitHub Sync Agent from section 3.4
4. Implement repository analysis from section 3.4.2:
   - Fetch repos from GitHub API
   - Extract metadata
   - Analyze README files
   - Calculate language breakdown
5. Implement change detection from section 3.4.3
6. Set up scheduled job (every 6 hours) from section 2.3.3
7. Add the manual trigger endpoint from section 5.1.8
8. Store updates in Project model
9. Add proper error handling and retry logic
10. Write tests with mocked GitHub API responses

Structure:
- packages/agents/src/github-sync-agent.ts
- apps/api/src/jobs/github-sync.job.ts
- apps/api/src/services/github.service.ts
```

### 16. Implement Cost Estimator

```
According to TECHNICAL_DOCUMENTATION.md section 3.6, create the Cost Estimator:

1. Implement the Cost Estimator Agent from section 3.6
2. Create feature complexity analysis (section 3.6.1)
3. Implement historical data comparison (section 3.6.2)
4. Add range calculation using the formula from section 3.6.3
5. Store estimates in CostEstimate model
6. Create the API endpoint from section 5.1.5
7. Build the interactive frontend component from section 6.1
8. Add proper input validation
9. Write comprehensive tests

Components:
- packages/agents/src/cost-estimator-agent.ts
- apps/api/src/routes/estimates.ts
- apps/web/src/widgets/CostEstimator.tsx

Make the estimator interactive with real-time updates as user adds features.
```

### 17. Implement Full Monitoring Stack

```
Following TECHNICAL_DOCUMENTATION.md section 10, implement monitoring and observability:

1. Set up Winston for structured logging (section 10.1)
2. Configure Sentry for error tracking (section 10.2)
3. Implement performance monitoring (section 10.3):
   - API response time tracking
   - Database query performance
   - AI API latency
   - Cache hit/miss rates
4. Set up analytics tracking (section 10.4)
5. Implement health check endpoint from section 10.5
6. Add custom middleware for request/response logging
7. Create monitoring dashboard queries
8. Set up alerts for critical metrics

Log all AI interactions with costs, tokens, and latency.
```

### 18. Implement Security Features

```
Based on TECHNICAL_DOCUMENTATION.md section 9, implement all security measures:

1. Set up JWT authentication (section 9.1)
2. Implement input validation with Zod for all endpoints (section 9.2)
3. Add rate limiting to all endpoints (section 9.3)
4. Configure CORS whitelist (section 9.3)
5. Set up Content Security Policy headers (section 9.4)
6. Implement secure cookie configuration (section 9.4)
7. Add AI input sanitization (section 9.6)
8. Set up dependency vulnerability scanning
9. Create security middleware
10. Write security tests

Ensure all endpoints follow the security specifications exactly.
```

---

## Example: Complete Feature Implementation

### 19. Implement Complete Blog Feature (End-to-End)

```
Using TECHNICAL_DOCUMENTATION.md, implement the complete blog feature from backend to frontend:

Backend (sections 4.2, 5.1.6):
1. Blog model is already in schema - ensure it's migrated
2. Implement GET /api/blog with filtering by status and tags
3. Implement GET /api/blog/:slug
4. Add caching (60 minutes)
5. Increment view count on each view
6. Add proper error handling and validation

Agent (section 3.5):
1. Create Blog Generator Agent
2. Implement trigger conditions
3. Create content generation workflow
4. Add SEO optimization
5. Save drafts to database
6. Set up scheduled job for weekly digest

Frontend (section 6.1):
1. Create Blog page with BlogList
2. Create BlogCard components
3. Create BlogPost page with PostHeader, PostContent, ShareButtons
4. Implement syntax highlighting for code blocks
5. Add reading time calculation
6. Make fully responsive
7. Add SEO meta tags

Tests:
1. Unit tests for all services
2. Integration tests for all endpoints
3. Component tests for blog UI
4. E2E test for complete blog flow

Please implement this feature completely, following all specifications from the documentation.
```

---

## Tips for Best Results

### Do's ✅

1. **Reference specific sections**: "According to section 3.2.5..."
2. **Be explicit about requirements**: tests, types, error handling, etc.
3. **Request verification**: "Verify this matches the documentation exactly"
4. **Ask for structure**: "Create the file structure first, then implement"
5. **Iterate**: Start with skeleton, then add functionality
6. **Request explanations**: "Explain how this implements the specification"

### Don'ts ❌

1. **Don't be vague**: "Build the backend" is too broad
2. **Don't skip tests**: Always include testing requirements
3. **Don't ignore error handling**: Always request it explicitly
4. **Don't forget types**: Always ask for TypeScript types
5. **Don't skip documentation**: Ask for code comments

---

## Progressive Implementation Strategy

For best results, follow this order:

1. **Foundation** (Prompts 1-3): Set up project structure
2. **Database** (Prompt 2): Get data layer working
3. **Simple API** (Prompts 4-5): Implement basic CRUD endpoints
4. **Frontend Foundation** (Prompt 7): Set up React app
5. **Simple UI** (Prompt 8): Implement basic pages
6. **Testing** (Prompt 13): Set up test infrastructure
7. **AI Features** (Prompts 10-12): Add AI agents
8. **Advanced Features** (Prompts 15-17): Add complex functionality
9. **Polish** (Prompt 18): Add security and monitoring

---

## Example Interaction Flow

```
You: [Use Prompt 1 - Initialize Backend]

Claude Code: [Creates all files, sets up structure]

You: "Great! Now verify that the structure matches section 7.5 exactly and that all dependencies from section 1.3 are included."

Claude Code: [Verifies and adds missing pieces]

You: [Use Prompt 2 - Initialize Database]

Claude Code: [Sets up Prisma]

You: "Run the migration and seed the database, then verify Prisma Client is generated correctly."

Claude Code: [Executes commands]

You: [Use Prompt 4 - Implement Profile Endpoint]

Claude Code: [Implements endpoint with tests]

You: "Run the tests to verify they pass, and check that coverage is above 80%."

Claude Code: [Runs tests, reports results]
```

---

## Verification Prompts

After any implementation, use these to verify:

```
"Please verify that this implementation matches the specifications in TECHNICAL_DOCUMENTATION.md section [X.X]. Check:
1. API contract (request/response format)
2. Error handling
3. Rate limiting
4. Caching strategy
5. TypeScript types
6. Test coverage

List any discrepancies found."
```

```
"Run all tests for the feature we just implemented and report:
1. Test results (pass/fail)
2. Coverage percentage
3. Any warnings or errors
4. Suggestions for additional tests"
```

```
"Review the code we just wrote against the code style guidelines in section 7.4. Check:
1. ESLint compliance
2. TypeScript strict mode compliance
3. Naming conventions
4. Code organization
5. Comments and documentation

Fix any issues found."
```

---

## Troubleshooting Prompts

If something isn't working:

```
"The implementation isn't working as expected. Please:
1. Review section [X.X] of TECHNICAL_DOCUMENTATION.md again
2. Compare our implementation to the specification
3. Identify what's different
4. Fix the issues
5. Explain what was wrong and how you fixed it"
```

```
"Tests are failing. Please:
1. Run the tests and show me the output
2. Identify which test is failing and why
3. Fix the issue
4. Verify all tests pass
5. Check test coverage is still above 80%"
```

---

This guide should give you a comprehensive set of prompts to work through implementing the entire DevPortfolio AI project using Claude Code!
