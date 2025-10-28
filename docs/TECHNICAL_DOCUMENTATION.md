# DevPortfolio AI - Technical Documentation

**Version 1.0**
**October 2025**

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture](#2-system-architecture)
3. [AI Agent Design with Mastra](#3-ai-agent-design-with-mastra)
4. [Database Schema](#4-database-schema)
5. [API Documentation](#5-api-documentation)
6. [Frontend Architecture](#6-frontend-architecture)
7. [Development Guide](#7-development-guide)
8. [Deployment Guide](#8-deployment-guide)
9. [Security Considerations](#9-security-considerations)
10. [Monitoring & Observability](#10-monitoring--observability)
11. [Future Enhancements](#11-future-enhancements)
12. [Appendices](#12-appendices)

---

## 1. Executive Summary

### 1.1 Project Overview

DevPortfolio AI is a next-generation portfolio website that leverages artificial intelligence to create an interactive, personalized experience for visitors. Built for Rodrigo Vasconcelos de Barros, a Senior Software Engineer with 8+ years of experience, this platform goes beyond static content by intelligently engaging visitors, showcasing relevant work, and generating custom proposals.

### 1.2 Key Objectives

- Demonstrate technical expertise through an AI-powered platform
- Automate client engagement and lead qualification
- Maintain fresh, up-to-date content through GitHub integration
- Reduce time spent on repetitive client inquiries
- Optimize for search engines and user engagement
- Showcase full-stack development capabilities

### 1.3 Technology Stack Summary

| Component | Technologies |
|-----------|-------------|
| **Frontend** | React 18+, TypeScript, TailwindCSS, React Query, Framer Motion |
| **Backend** | Node.js 20+, Express.js, TypeScript, Prisma ORM |
| **AI Framework** | Mastra AI Agent Framework, Anthropic Claude Sonnet 4.5 |
| **Database** | PostgreSQL with pgvector, Redis, Pinecone (vector DB) |
| **Infrastructure** | Docker, Turborepo, GitHub Actions CI/CD |

### 1.4 Expected Outcomes

- Reduce client inquiry response time from hours to seconds
- Increase lead qualification efficiency by 70%
- Maintain portfolio freshness with automated GitHub syncing
- Generate 5-10 qualified leads per month
- Achieve sub-2-second initial page load time
- Demonstrate AI proficiency to potential clients

---

## 2. System Architecture

### 2.1 High-Level Architecture

DevPortfolio AI follows a modern, cloud-native architecture with clear separation of concerns. The system is organized into three primary layers: presentation, application, and data, with AI services integrated horizontally across all layers.

#### Architecture Diagram

```mermaid
graph TB
    subgraph Client["Client Layer"]
        Browser[Web Browser]
        Mobile[Mobile Browser]
    end

    subgraph CDN["CDN & Edge"]
        CF[Cloudflare/Vercel Edge]
    end

    subgraph Frontend["Frontend Layer"]
        React[React 18 SPA]
        Router[React Router]
        State[React Query + Context]
    end

    subgraph Backend["Backend Layer"]
        API[Express API Server]
        WS[WebSocket Server]
        Jobs[Bull Queue Workers]
    end

    subgraph AI["AI Layer"]
        Mastra[Mastra Framework]
        Claude[Claude API]
        Vector[Vector DB]
    end

    subgraph Data["Data Layer"]
        PG[(PostgreSQL)]
        Redis[(Redis Cache)]
    end

    subgraph External["External Services"]
        GitHub[GitHub API]
        Email[SendGrid]
        Analytics[Analytics]
    end

    Browser --> CF
    Mobile --> CF
    CF --> React
    React --> API
    React --> WS
    API --> Mastra
    API --> PG
    API --> Redis
    WS --> Mastra
    Jobs --> GitHub
    Jobs --> Email
    Mastra --> Claude
    Mastra --> Vector
    Mastra --> PG
```

### 2.2 Component Interactions

#### 2.2.1 Request Flow

1. User visits website, CDN serves static assets
2. React app bootstraps, establishes WebSocket connection
3. Initial data fetched via REST API (profile, featured projects)
4. User interactions trigger API calls or WebSocket messages
5. Backend routes requests to appropriate handlers or AI agents
6. Responses cached in Redis for subsequent requests
7. Frontend updates UI reactively using React Query

#### 2.2.2 AI Chat Interaction Sequence

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant WS as WebSocket
    participant API as API Server
    participant M as Mastra Agent
    participant C as Claude API
    participant DB as PostgreSQL
    participant V as Vector DB

    U->>FE: Types message in chat
    FE->>WS: Send message via WebSocket
    WS->>API: Forward to chat handler
    API->>M: Invoke Chat Agent
    M->>DB: Load conversation history
    M->>V: Retrieve relevant context (RAG)
    M->>C: Send prompt with context
    C-->>M: Stream response tokens
    M-->>WS: Stream to WebSocket
    WS-->>FE: Stream to frontend
    FE-->>U: Display streaming response
    M->>DB: Save conversation
```

### 2.3 Data Flow Architecture

#### 2.3.1 Read Operations

- Frontend requests data via React Query
- API checks Redis cache first (TTL: 5-60 minutes depending on data type)
- Cache miss triggers PostgreSQL query
- Results cached in Redis for subsequent requests
- Frontend caches in React Query (stale-while-revalidate pattern)

#### 2.3.2 Write Operations

- Frontend sends mutation via REST API
- API validates input and updates PostgreSQL
- Related cache entries invalidated in Redis
- Frontend receives confirmation and updates local cache
- Optimistic updates used where appropriate

#### 2.3.3 Background Jobs

- Bull queues manage asynchronous tasks
- GitHub sync runs every 6 hours (configurable)
- Email notifications sent via queue
- AI blog post generation queued after significant commits
- Failed jobs retry with exponential backoff

---

## 3. AI Agent Design with Mastra

### 3.1 Mastra Framework Overview

Mastra is a modern AI agent framework that provides orchestration, memory management, and tool integration for building production-ready AI applications. Our implementation leverages Mastra's agent system to create specialized agents for different portfolio functions.

### 3.2 Chat Agent

#### 3.2.1 Purpose

The Chat Agent serves as the primary interface for visitor interaction, answering questions about Rodrigo's experience, skills, and availability while maintaining context throughout the conversation.

#### 3.2.2 System Prompt Design

```
You are an AI assistant representing Rodrigo Vasconcelos de Barros,
a Senior Software Engineer with 8+ years of experience.

Background:
- Expertise: Ruby, Rails, JavaScript, Full-stack development
- Location: Toronto, Ontario, Canada
- Languages: English (professional), Portuguese (native), German (elementary)
- Currently: Full-time at Lillio, available for part-time freelance

Your role:
1. Answer questions about Rodrigo's experience and skills
2. Suggest relevant portfolio projects based on visitor interests
3. Provide technical insights and recommendations
4. Qualify leads by understanding project requirements
5. Direct visitors to appropriate sections of the portfolio

Guidelines:
- Be professional but conversational
- Use technical language appropriately for the audience
- Proactively suggest relevant projects or blog posts
- When discussing availability, mention part-time freelance capacity
- For complex projects, suggest generating a detailed proposal
```

#### 3.2.3 Function Calling

The Chat Agent has access to these functions for dynamic interaction:

- `searchProjects(query, technologies)` - Find relevant portfolio items
- `getProjectDetails(projectId)` - Retrieve full project information
- `searchBlogPosts(topic)` - Find related technical articles
- `checkAvailability()` - Get current freelance availability
- `suggestProposal(requirements)` - Recommend proposal generation

#### 3.2.4 Context Management

- Conversation history stored in PostgreSQL
- Last 10 messages included in context window
- RAG system retrieves relevant portfolio content based on conversation
- Session expires after 1 hour of inactivity
- Context window managed to stay under Claude's token limits

#### 3.2.5 Implementation Example

```typescript
// packages/agents/src/chat-agent.ts
import { Agent, Tool } from '@mastra/core';
import { anthropic } from '@mastra/anthropic';

const searchProjectsTool = new Tool({
  name: 'searchProjects',
  description: 'Search portfolio projects by query or technologies',
  parameters: {
    query: { type: 'string', description: 'Search query' },
    technologies: { type: 'array', items: { type: 'string' } }
  },
  execute: async ({ query, technologies }) => {
    return await prisma.project.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { technologies: { hasSome: technologies } }
        ]
      }
    });
  }
});

export const chatAgent = new Agent({
  name: 'portfolio-chat',
  model: anthropic('claude-sonnet-4.5'),
  systemPrompt: CHAT_SYSTEM_PROMPT,
  tools: [searchProjectsTool, getProjectDetailsTool, ...],
  memory: {
    type: 'postgresql',
    maxMessages: 10
  }
});
```

### 3.3 Proposal Generator Agent

#### 3.3.1 Multi-Step Workflow

1. Extract project requirements from visitor input
2. Search portfolio for relevant past work
3. Analyze complexity and estimate timeline
4. Generate proposal outline with matched experience
5. Calculate pricing based on historical data
6. Format as professional document

#### 3.3.2 Prompt Engineering Strategy

```
Step 1: Requirement Extraction
Analyze the following project description and extract:
- Core features required
- Technology preferences
- Timeline constraints
- Budget range (if mentioned)
- Success criteria

Step 2: Portfolio Matching
Based on requirements, identify 2-3 most relevant past projects.
For each match, explain why it's relevant and what lessons apply.

Step 3: Proposal Generation
Create a professional proposal outline including:
- Executive summary
- Approach and methodology
- Timeline with milestones
- Pricing (range with confidence level)
- Relevant experience highlights
- Next steps
```

#### 3.3.3 Implementation Pattern

```typescript
export const proposalAgent = new Agent({
  name: 'proposal-generator',
  model: anthropic('claude-sonnet-4.5'),
  workflow: {
    steps: [
      { name: 'extract', prompt: EXTRACTION_PROMPT },
      { name: 'match', prompt: MATCHING_PROMPT, tools: [searchProjectsTool] },
      { name: 'estimate', prompt: ESTIMATION_PROMPT },
      { name: 'generate', prompt: GENERATION_PROMPT }
    ]
  }
});
```

### 3.4 GitHub Sync Agent

#### 3.4.1 Scheduled Job Configuration

- Runs every 6 hours via Bull queue
- Fetches latest repositories from GitHub API
- Extracts metadata: languages, stars, forks, last updated
- Analyzes README files for project descriptions
- Calculates contribution statistics
- Updates database with new or changed projects

#### 3.4.2 Repository Analysis

```
For each repository, the agent:
1. Reads README.md and extracts description
2. Analyzes language breakdown
3. Checks for key files (package.json, Gemfile, etc.)
4. Extracts topics/tags
5. Determines if repository should be featured
6. Generates a portfolio-friendly summary
```

#### 3.4.3 Change Detection

- Compare current data with database snapshot
- Detect new repositories
- Identify updated repositories (commits, stars, etc.)
- Flag repositories that haven't been updated in 2+ years
- Generate notifications for significant changes

### 3.5 Blog Generator Agent

#### 3.5.1 Trigger Conditions

- Significant commit activity (10+ commits in a day)
- New repository created
- Major milestone reached (100th commit, 50 stars)
- Manual trigger from admin interface
- Scheduled weekly digest

#### 3.5.2 Content Generation Process

1. Analyze recent commit messages
2. Extract code patterns and technologies used
3. Identify interesting technical decisions
4. Generate blog post outline
5. Write draft with code examples
6. Add SEO metadata and tags
7. Save as draft for review

#### 3.5.3 SEO Optimization

- Generate keyword-rich titles
- Create compelling meta descriptions
- Suggest internal links to relevant projects
- Add schema markup for articles
- Optimize for target search terms

### 3.6 Cost Estimator Agent

#### 3.6.1 Feature Complexity Analysis

```
The agent evaluates each feature on multiple dimensions:
- Technical complexity (1-10 scale)
- Time estimate (hours)
- Risk factors
- Dependencies on other features
- Uncertainty level
```

#### 3.6.2 Historical Data Comparison

- Compare new project to similar past projects
- Identify analogous features
- Extract actual time spent on comparable work
- Calculate variance and adjust estimates
- Account for learning curve on new technologies

#### 3.6.3 Range Calculation

```
Estimates provided as ranges with confidence levels:
- Optimistic: 80% confidence
- Most Likely: 50% confidence
- Pessimistic: 95% confidence

Formula: (Optimistic + 4 * Most Likely + Pessimistic) / 6
```

### 3.7 RAG Implementation

#### 3.7.1 Vector Database Setup

- Use Pinecone or PostgreSQL with pgvector extension
- Embed all portfolio content (projects, blog posts, skills)
- Chunk size: 500 tokens with 50-token overlap
- Embedding model: text-embedding-ada-002 or similar
- Index by category: projects, blog, skills, experience

#### 3.7.2 Retrieval Strategy

1. Convert user query to embedding
2. Search vector DB for top 5 most relevant chunks
3. Apply metadata filters (e.g., project category)
4. Re-rank results by relevance score
5. Include in agent context with attribution

#### 3.7.3 Context Injection

```typescript
const context = await vectorDB.search({
  query: userMessage,
  topK: 5,
  filter: { category: 'projects' }
});

const enhancedPrompt = `
Relevant information:
${context.map(c => c.content).join('\n\n')}

User question: ${userMessage}
`;
```

### 3.8 Fallback Strategies

#### 3.8.1 AI Service Unavailability

- Gracefully degrade to cached responses for common questions
- Display helpful error message with alternative contact methods
- Queue failed requests for retry
- Send notification to admin
- Fall back to rule-based chatbot for basic queries

#### 3.8.2 Rate Limiting

- Implement token bucket algorithm for AI API calls
- Cache responses for identical or similar queries
- Prioritize interactive chat over background jobs
- Provide estimated wait time when rate limited

#### 3.8.3 Quality Assurance

- Monitor agent responses for harmful or incorrect content
- Implement confidence scoring for agent outputs
- Human review for proposals before sending
- Log all AI interactions for quality analysis

---

## 4. Database Schema

### 4.1 Prisma Schema Overview

The database schema is designed to support all portfolio features while maintaining referential integrity and query performance. Below is the complete Prisma schema definition.

### 4.2 Complete Schema

```prisma
// packages/database/prisma/schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

// Vector extension for RAG
generator vector {
  provider = "prisma-client-js"
  extensions = ["vector"]
}

model Profile {
  id              String   @id @default(cuid())
  fullName        String
  title           String
  email           String   @unique
  phone           String?
  location        String
  bio             String
  shortBio        String
  yearsExperience Int
  githubUrl       String?
  linkedinUrl     String?
  twitterUrl      String?
  availability    String // "available", "limited", "unavailable"
  hourlyRate      Decimal?
  resumeUrl       String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model Project {
  id              String   @id @default(cuid())
  title           String
  slug            String   @unique
  description     String
  longDescription String?
  technologies    String[] // Array of tech names
  featured        Boolean  @default(false)
  category        String // "web", "mobile", "backend", etc.
  githubUrl       String?
  liveUrl         String?
  imageUrl        String?
  startDate       DateTime?
  endDate         DateTime?
  githubStars     Int?
  githubForks     Int?
  lastCommit      DateTime?
  order           Int      @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  embedding       Vector?  // For RAG

  @@index([featured, order])
  @@index([category])
}

model Skill {
  id          String   @id @default(cuid())
  name        String   @unique
  category    String // "language", "framework", "tool", etc.
  proficiency Int // 1-5 scale
  yearsUsed   Int?
  order       Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([category, order])
}

model Experience {
  id          String   @id @default(cuid())
  company     String
  position    String
  location    String?
  description String
  startDate   DateTime
  endDate     DateTime?
  current     Boolean  @default(false)
  order       Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([order])
}

model Testimonial {
  id          String   @id @default(cuid())
  clientName  String
  company     String?
  position    String?
  content     String
  rating      Int? // 1-5
  projectId   String?
  featured    Boolean  @default(false)
  approved    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([approved, featured])
}

model BlogPost {
  id              String   @id @default(cuid())
  title           String
  slug            String   @unique
  excerpt         String
  content         String
  coverImage      String?
  tags            String[]
  status          String // "draft", "published"
  publishedAt     DateTime?
  viewCount       Int      @default(0)
  aiGenerated     Boolean  @default(false)
  githubCommitRef String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  embedding       Vector?  // For RAG

  @@index([status, publishedAt])
  @@index([tags])
}

model Conversation {
  id          String   @id @default(cuid())
  sessionId   String   @unique
  messages    Json[] // Array of message objects
  metadata    Json? // Visitor info, referrer, etc.
  lastActivity DateTime @default(now())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([sessionId])
  @@index([lastActivity])
}

model Proposal {
  id              String   @id @default(cuid())
  conversationId  String?
  clientEmail     String
  clientName      String?
  projectTitle    String
  requirements    String
  proposalContent String
  estimatedHours  Int?
  estimatedCost   Decimal?
  status          String // "draft", "sent", "accepted", "rejected"
  sentAt          DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([status, createdAt])
  @@index([clientEmail])
}

model CostEstimate {
  id                  String   @id @default(cuid())
  sessionId           String
  projectType         String
  features            Json[] // Array of feature objects
  totalHoursOptimistic Int
  totalHoursLikely    Int
  totalHoursPessimistic Int
  confidenceLevel     Int // 1-100
  breakdown           Json
  createdAt           DateTime @default(now())

  @@index([sessionId])
}

model AnalyticsEvent {
  id          String   @id @default(cuid())
  eventType   String // "page_view", "chat_started", etc.
  sessionId   String
  metadata    Json?
  timestamp   DateTime @default(now())

  @@index([eventType, timestamp])
  @@index([sessionId])
}
```

### 4.3 Entity Relationships

```mermaid
erDiagram
    Profile ||--o{ Testimonial : receives
    Project ||--o{ Testimonial : relates-to
    BlogPost }o--|| Project : references
    Conversation ||--o{ Proposal : generates
    Conversation ||--o{ CostEstimate : produces
    Conversation ||--o{ AnalyticsEvent : tracks
```

### 4.4 Migration Strategy

#### 4.4.1 Initial Migration

```bash
npx prisma migrate dev --name init
npx prisma generate
npx prisma db push
```

#### 4.4.2 Subsequent Migrations

```bash
# Create migration
npx prisma migrate dev --name add_vector_support

# Apply to production
npx prisma migrate deploy
```

#### 4.4.3 Seed Data

```typescript
// packages/database/prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create profile
  const profile = await prisma.profile.create({
    data: {
      fullName: 'Rodrigo Vasconcelos de Barros',
      title: 'Senior Software Engineer',
      email: 'rodrigo@example.com',
      location: 'Toronto, Ontario, Canada',
      bio: 'Experienced full-stack engineer...',
      shortBio: 'Building scalable web applications',
      yearsExperience: 8,
      availability: 'limited'
    }
  });

  // Create skills
  await prisma.skill.createMany({
    data: [
      { name: 'Ruby', category: 'language', proficiency: 5, order: 1 },
      { name: 'JavaScript', category: 'language', proficiency: 5, order: 2 },
      { name: 'Rails', category: 'framework', proficiency: 5, order: 1 }
    ]
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

---

## 5. API Documentation

### 5.1 RESTful API Endpoints

#### 5.1.1 Profile Endpoints

```
GET /api/profile
Description: Get portfolio owner's profile information
Response: {
  fullName: string,
  title: string,
  bio: string,
  location: string,
  availability: string,
  githubUrl: string,
  linkedinUrl: string
}
Cache: 60 minutes
```

#### 5.1.2 Project Endpoints

```
GET /api/projects
Query Parameters:
  ?featured=true - Filter by featured projects
  ?category=web - Filter by category
  ?tech=React,TypeScript - Filter by technologies
  ?limit=10 - Limit results (default: 20)
  ?offset=0 - Pagination offset

Response: {
  projects: Project[],
  total: number,
  hasMore: boolean
}
Cache: 30 minutes

GET /api/projects/:slug
Description: Get detailed project information
Response: {
  id: string,
  title: string,
  description: string,
  longDescription: string,
  technologies: string[],
  githubUrl: string,
  liveUrl: string,
  imageUrl: string,
  startDate: string,
  endDate: string
}
Cache: 30 minutes
```

#### 5.1.3 Chat Endpoints

```
POST /api/chat
Request: {
  message: string,
  sessionId: string,
  metadata?: object
}

Response: Stream (text/event-stream)
Event types:
  - data: { type: 'token', content: string }
  - data: { type: 'function_call', name: string, args: object }
  - data: { type: 'done', conversationId: string }

Rate Limit: 20 requests per 10 minutes per session
```

#### 5.1.4 Proposal Endpoints

```
POST /api/proposals/generate
Request: {
  requirements: string,
  clientEmail: string,
  clientName?: string,
  conversationId?: string
}

Response: {
  proposalId: string,
  content: string,
  estimatedHours: number,
  estimatedCost: number
}
Rate Limit: 5 requests per hour per IP
```

#### 5.1.5 Cost Estimator Endpoints

```
POST /api/estimates/calculate
Request: {
  projectType: string,
  features: Array<{
    name: string,
    description: string,
    complexity?: number
  }>
}

Response: {
  estimateId: string,
  optimistic: number,
  likely: number,
  pessimistic: number,
  confidence: number,
  breakdown: object
}
```

#### 5.1.6 Blog Endpoints

```
GET /api/blog
Query Parameters:
  ?status=published - Filter by status
  ?tag=javascript - Filter by tag
  ?limit=10

Response: {
  posts: BlogPost[],
  total: number
}

GET /api/blog/:slug
Description: Get blog post content
Response: BlogPost object
Cache: 60 minutes
```

#### 5.1.7 Testimonial Endpoints

```
POST /api/testimonials
Request: {
  clientName: string,
  company?: string,
  position?: string,
  content: string,
  rating?: number,
  projectId?: string
}

Response: {
  id: string,
  message: string
}
```

#### 5.1.8 GitHub Sync Endpoints

```
POST /api/github/sync
Description: Trigger GitHub sync job (admin only)
Auth: Required
Response: {
  jobId: string,
  status: string
}
```

### 5.2 WebSocket API

#### 5.2.1 Connection

```typescript
const ws = new WebSocket('wss://api.example.com/ws');

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'auth',
    sessionId: 'session-123'
  }));
};
```

#### 5.2.2 Message Types

```typescript
// Client -> Server
{ type: 'chat', message: string, sessionId: string }
{ type: 'typing', isTyping: boolean }
{ type: 'ping' }

// Server -> Client
{ type: 'token', content: string }
{ type: 'done', conversationId: string }
{ type: 'error', message: string }
{ type: 'pong' }
```

### 5.3 Authentication

Most endpoints are public. Admin endpoints require JWT authentication.

```
POST /api/auth/login
Request: { email: string, password: string }
Response: { token: string, expiresIn: number }

Headers for authenticated requests:
Authorization: Bearer <token>
```

### 5.4 Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| Chat | 20 requests | 10 minutes |
| Proposals | 5 requests | 1 hour |
| Estimates | 10 requests | 1 hour |
| General API | 100 requests | 15 minutes |

### 5.5 Error Handling

#### 5.5.1 Error Response Format

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": {}
  }
}
```

#### 5.5.2 HTTP Status Codes

- **200 OK** - Successful request
- **201 Created** - Resource created successfully
- **400 Bad Request** - Invalid input
- **401 Unauthorized** - Authentication required
- **403 Forbidden** - Insufficient permissions
- **404 Not Found** - Resource not found
- **429 Too Many Requests** - Rate limit exceeded
- **500 Internal Server Error** - Server error
- **503 Service Unavailable** - AI service unavailable

---

## 6. Frontend Architecture

### 6.1 Component Hierarchy

```
App
├── Layout
│   ├── Header
│   │   ├── Navigation
│   │   └── MobileMenu
│   ├── Main (Router Outlet)
│   └── Footer
├── Pages
│   ├── Home
│   │   ├── Hero
│   │   ├── FeaturedProjects
│   │   ├── Skills
│   │   └── CallToAction
│   ├── Projects
│   │   ├── ProjectGrid
│   │   │   └── ProjectCard[]
│   │   └── ProjectFilters
│   ├── ProjectDetail
│   │   ├── ProjectHeader
│   │   ├── ProjectContent
│   │   ├── TechnologyStack
│   │   └── RelatedProjects
│   ├── Blog
│   │   └── BlogList
│   │       └── BlogCard[]
│   ├── BlogPost
│   │   ├── PostHeader
│   │   ├── PostContent
│   │   └── ShareButtons
│   ├── About
│   │   ├── AboutHero
│   │   ├── Experience
│   │   ├── TestimonialCarousel
│   │   └── GitHubStats
│   └── Contact
│       ├── ContactForm
│       └── ContactInfo
└── Widgets
    ├── ChatWidget
    │   ├── ChatButton
    │   ├── ChatWindow
    │   │   ├── MessageList
    │   │   │   └── Message[]
    │   │   └── MessageInput
    │   └── SuggestedQuestions
    ├── ProposalModal
    │   └── ProposalForm
    └── CostEstimator
        ├── FeatureInput
        └── EstimateDisplay
```

### 6.2 State Management

#### 6.2.1 React Query for Server State

```typescript
// hooks/useProjects.ts
import { useQuery } from '@tanstack/react-query';

export function useProjects(filters) {
  return useQuery({
    queryKey: ['projects', filters],
    queryFn: () => api.getProjects(filters),
    staleTime: 30 * 60 * 1000, // 30 minutes
    cacheTime: 60 * 60 * 1000 // 1 hour
  });
}
```

#### 6.2.2 Context for UI State

```typescript
// contexts/ChatContext.tsx
export const ChatContext = createContext();

export function ChatProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(null);

  return (
    <ChatContext.Provider value={{ isOpen, setIsOpen, messages, ... }}>
      {children}
    </ChatContext.Provider>
  );
}
```

### 6.3 Routing Structure

```typescript
const routes = [
  { path: '/', element: <Home /> },
  { path: '/projects', element: <Projects /> },
  { path: '/projects/:slug', element: <ProjectDetail /> },
  { path: '/blog', element: <Blog /> },
  { path: '/blog/:slug', element: <BlogPost /> },
  { path: '/about', element: <About /> },
  { path: '/contact', element: <Contact /> },
  { path: '*', element: <NotFound /> }
];
```

### 6.4 Performance Optimization

#### 6.4.1 Code Splitting

```typescript
// Lazy load heavy components
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const ChatWidget = lazy(() => import('./widgets/ChatWidget'));
const CostEstimator = lazy(() => import('./widgets/CostEstimator'));
```

#### 6.4.2 Image Optimization

- Use WebP format with JPEG/PNG fallbacks
- Implement lazy loading for images below fold
- Provide responsive image sizes
- Use blur placeholder while loading
- Optimize images during build (sharp or similar)

#### 6.4.3 Bundle Optimization

- Tree shaking enabled
- Separate vendor bundles
- Compress with gzip/brotli
- Target modern browsers (ES2020+)
- Remove unused CSS with PurgeCSS

### 6.5 Accessibility

- Semantic HTML elements throughout
- ARIA labels for interactive elements
- Keyboard navigation support
- Focus management in modals and widgets
- Color contrast ratio of at least 4.5:1
- Screen reader tested
- Skip navigation links

### 6.6 Responsive Design

#### 6.6.1 Breakpoints

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px
- **Large Desktop**: > 1440px

#### 6.6.2 Mobile-First Approach

```typescript
// Default styles for mobile
className="p-4 text-sm"

// Override for larger screens
className="p-4 text-sm md:p-8 md:text-base lg:p-12 lg:text-lg"
```

---

## 7. Development Guide

### 7.1 Local Setup

#### 7.1.1 Prerequisites

- Node.js 20+ installed
- Docker and Docker Compose installed
- Git configured
- PostgreSQL client tools (optional)

#### 7.1.2 Initial Setup

```bash
# Clone repository
git clone https://github.com/rodrigo/portfolio-ai.git
cd portfolio-ai

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start services with Docker
docker-compose up -d

# Run database migrations
npm run db:migrate

# Seed database
npm run db:seed

# Start development servers
npm run dev
```

#### 7.1.3 Environment Variables

```env
# .env
DATABASE_URL=postgresql://user:password@localhost:5432/portfolio
REDIS_URL=redis://localhost:6379
CLAUDE_API_KEY=your_anthropic_api_key
GITHUB_TOKEN=your_github_token
GITHUB_USERNAME=your_github_username
SENDGRID_API_KEY=your_sendgrid_key
JWT_SECRET=your_jwt_secret
NODE_ENV=development

# Frontend
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
```

### 7.2 Development Workflow

1. Create feature branch from main
2. Make changes and write tests
3. Run linter and tests locally
4. Commit with conventional commit message
5. Push and create pull request
6. Address review feedback
7. Merge when approved and CI passes

### 7.3 Testing Strategy

#### 7.3.1 Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test chat-agent.test.ts
```

#### 7.3.2 Test Structure

```typescript
// Example unit test
describe('ChatAgent', () => {
  it('should respond to greeting', async () => {
    const agent = new ChatAgent();
    const response = await agent.chat('Hello');
    expect(response).toContain('Hi');
  });
});
```

### 7.4 Code Style Guidelines

#### 7.4.1 TypeScript Configuration

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

#### 7.4.2 ESLint Rules

- Use TypeScript-recommended rules
- Enforce consistent imports
- No unused variables
- Consistent naming conventions

#### 7.4.3 Commit Messages

Follow Conventional Commits:

```
feat: add chat streaming support
fix: resolve memory leak in WebSocket
docs: update API documentation
test: add tests for proposal generator
chore: update dependencies
```

### 7.5 Monorepo Structure

```
portfolio-ai/
├── apps/
│   ├── web/                 # React frontend
│   └── api/                 # Node.js backend
├── packages/
│   ├── shared/              # Shared types and utilities
│   ├── ui/                  # Shared React components
│   ├── agents/              # Mastra AI agents
│   ├── database/            # Prisma schema and migrations
│   └── config/              # Shared configuration
├── docker/
│   ├── web.Dockerfile
│   ├── api.Dockerfile
│   └── docker-compose.yml
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
├── package.json
├── turbo.json
├── tsconfig.json
└── README.md
```

---

## 8. Deployment Guide

### 8.1 Production Build

```bash
# Build all packages
npm run build

# Build Docker images
docker build -f docker/web.Dockerfile -t portfolio-web .
docker build -f docker/api.Dockerfile -t portfolio-api .
```

### 8.2 Docker Configuration

#### 8.2.1 Web Dockerfile

```dockerfile
# docker/web.Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### 8.2.2 API Dockerfile

```dockerfile
# docker/api.Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

USER node
EXPOSE 3001

CMD ["node", "dist/index.js"]
```

#### 8.2.3 Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: portfolio
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  api:
    build:
      context: .
      dockerfile: docker/api.Dockerfile
    environment:
      DATABASE_URL: postgresql://user:password@postgres:5432/portfolio
      REDIS_URL: redis://redis:6379
    ports:
      - "3001:3001"
    depends_on:
      - postgres
      - redis

  web:
    build:
      context: .
      dockerfile: docker/web.Dockerfile
    ports:
      - "80:80"
    depends_on:
      - api

volumes:
  postgres_data:
```

### 8.3 CI/CD Pipeline

#### 8.3.1 GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Test
        run: npm test -- --coverage

      - name: Build
        run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3

      - name: Build and push Docker images
        run: |
          docker build -f docker/web.Dockerfile -t portfolio-web .
          docker build -f docker/api.Dockerfile -t portfolio-api .

      - name: Deploy to production
        run: |
          # Deployment commands here
```

#### 8.3.2 Pipeline Stages

1. Lint and format check
2. Run unit tests
3. Run integration tests
4. Build Docker images
5. Push to container registry
6. Deploy to staging
7. Run smoke tests
8. Deploy to production

### 8.4 Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates installed
- [ ] Monitoring and logging configured
- [ ] Backup strategy in place
- [ ] Rate limiting enabled
- [ ] CORS configured correctly
- [ ] Analytics tracking active
- [ ] Error tracking (Sentry) configured
- [ ] Health check endpoints responding

### 8.5 Environment Configuration

#### Production Environment Variables

```env
NODE_ENV=production
DATABASE_URL=postgresql://[secure-connection-string]
REDIS_URL=redis://[secure-connection-string]
CLAUDE_API_KEY=[secure-api-key]
GITHUB_TOKEN=[secure-token]
JWT_SECRET=[secure-random-string]
SENDGRID_API_KEY=[secure-api-key]
ALLOWED_ORIGINS=https://yourdomain.com
```

---

## 9. Security Considerations

### 9.1 Authentication & Authorization

- JWT tokens with short expiration (15 minutes)
- Refresh tokens with longer expiration (7 days)
- Secure token storage (httpOnly cookies)
- Admin endpoints protected with role checks

### 9.2 Input Validation

- All inputs validated with Zod schemas
- Sanitize HTML content
- Parameterized database queries (Prisma)
- File upload restrictions (type, size)

### 9.3 API Security

- Rate limiting per IP and per session
- CORS whitelist for allowed origins
- API key rotation policy
- Request size limits
- SQL injection prevention (ORM usage)

### 9.4 Frontend Security

- Content Security Policy headers
- XSS prevention (React escaping)
- Secure cookies (httpOnly, secure, sameSite)
- Subresource Integrity for CDN assets

### 9.5 Data Protection

- Encrypt sensitive data at rest
- Use HTTPS for all communications
- Implement GDPR compliance measures
- Regular security audits
- Dependency vulnerability scanning

### 9.6 AI Security

- Input sanitization before sending to AI
- Output validation from AI responses
- Rate limiting on AI endpoints
- Monitoring for prompt injection attempts
- Cost controls on AI usage

---

## 10. Monitoring & Observability

### 10.1 Logging Strategy

- Structured logging with Winston
- Log levels: error, warn, info, debug
- Request/response logging
- AI interaction logging
- Performance metrics

#### Example Log Format

```json
{
  "timestamp": "2025-10-28T19:30:00Z",
  "level": "info",
  "service": "api",
  "message": "Chat request processed",
  "sessionId": "session-123",
  "duration": 1250,
  "tokens": 450
}
```

### 10.2 Error Tracking

- Sentry for error monitoring
- Source maps for stack traces
- User context attached to errors
- Error alerting thresholds

### 10.3 Performance Monitoring

- Lighthouse CI for Core Web Vitals
- API response time tracking
- Database query performance
- AI API latency monitoring
- Cache hit/miss rates

#### Key Metrics

- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1
- **TTFB** (Time to First Byte): < 600ms

### 10.4 Analytics

- Page views and unique visitors
- Chat engagement metrics
- Proposal generation rate
- Project views by category
- Blog post readership
- Conversion funnel tracking

### 10.5 Health Checks

```typescript
// Health check endpoint
app.get('/api/health', async (req, res) => {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    ai: await checkAIService(),
    timestamp: new Date().toISOString()
  };

  const healthy = Object.values(checks).every(c => c === true);
  res.status(healthy ? 200 : 503).json(checks);
});
```

---

## 11. Future Enhancements

### 11.1 Short-Term (3-6 months)

- Multi-language support (Portuguese, German)
- Advanced analytics dashboard
- Email newsletter integration
- Video testimonials
- Interactive code demonstrations
- Dark mode support

### 11.2 Medium-Term (6-12 months)

- Voice-based chat interface
- AI-powered project recommender
- Automated blog post scheduling
- Client portal for active projects
- Integration with project management tools
- Advanced cost estimator with ROI calculator

### 11.3 Long-Term (12+ months)

- Mobile app (React Native)
- Marketplace for code templates
- Live coding sessions
- AI mentor feature for developers
- Community forum
- Multi-tenant SaaS platform

---

## 12. Appendices

### 12.1 Technology Decisions

#### Why React?

- Industry standard with vast ecosystem
- Excellent TypeScript support
- Strong community and resources
- Perfect for SPA with dynamic content

#### Why Mastra?

- Purpose-built for AI agent orchestration
- Built-in memory management
- Tool integration framework
- Production-ready patterns

#### Why Claude Sonnet 4.5?

- Best-in-class reasoning capabilities
- Long context window (200K tokens)
- Excellent for technical content
- Strong function calling support
- Competitive pricing

#### Why PostgreSQL?

- Robust and reliable
- Excellent JSON support
- pgvector extension for embeddings
- Great Prisma support

### 12.2 Glossary

- **RAG**: Retrieval Augmented Generation - AI technique that retrieves relevant context
- **Embedding**: Vector representation of text for semantic search
- **Token**: Unit of text processed by AI models
- **WebSocket**: Protocol for real-time bidirectional communication
- **SSR**: Server-Side Rendering
- **SPA**: Single Page Application
- **Monorepo**: Single repository containing multiple projects
- **ORM**: Object-Relational Mapping

### 12.3 Resources

- **Mastra Documentation**: https://mastra.ai/docs
- **Anthropic Claude API**: https://docs.anthropic.com
- **React Documentation**: https://react.dev
- **Prisma Documentation**: https://prisma.io/docs
- **TailwindCSS**: https://tailwindcss.com
- **Turborepo**: https://turbo.build/repo
- **Vitest**: https://vitest.dev

### 12.4 Contact Information

For questions or support regarding this documentation:

- **Email**: rodrigo@example.com
- **GitHub**: github.com/rodrigo
- **Project Repository**: github.com/rodrigo/portfolio-ai

---

**Document Version**: 1.0
**Last Updated**: October 28, 2025
**Maintained By**: Rodrigo Vasconcelos de Barros

---

## Quick Start Commands

```bash
# Installation
npm install

# Development
npm run dev

# Testing
npm test

# Build
npm run build

# Database
npm run db:migrate
npm run db:seed

# Docker
docker-compose up -d
docker-compose down

# Deployment
npm run deploy
```

---

*This documentation is a living document and will be updated as the project evolves.*
