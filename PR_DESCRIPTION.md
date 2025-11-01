# Pull Request: Implement Chat Agent with AI-Powered Portfolio Assistant

## Summary

This PR implements the AI-powered chat agent system as specified in the technical documentation (Section 3.2). The chat agent serves as an intelligent assistant for portfolio visitors, capable of answering questions about Rodrigo's experience, searching projects, checking availability, and suggesting proposal generation.

## Changes

### New Package: `@portfolio/agents`

Created a new workspace package that provides:
- Chat agent with Claude 3.5 Haiku integration
- 5 specialized function tools
- Conversation history management
- Comprehensive error handling
- Full test coverage

### Key Features Implemented

#### 1. Chat Agent (Section 3.2.5)
- **Streaming Responses**: Real-time token-by-token response generation via WebSocket
- **Non-Streaming Mode**: Complete response generation for API calls
- **Conversation History**: Stores last 10 messages in PostgreSQL (Section 3.2.4)
- **System Prompt**: Pre-configured prompt representing Rodrigo's background (Section 3.2.2)
- **Model**: Uses Claude 3.5 Haiku (claude-3-5-haiku-20241022)

#### 2. Function Tools (Section 3.2.3)

All tools include error handling, input validation, and comprehensive tests:

1. **searchProjects** - Find portfolio projects by query or technologies
   - Searches title, description, and longDescription fields
   - Filters by technology array
   - Returns up to 10 projects, ordered by featured status

2. **getProjectDetails** - Retrieve full project information
   - Accepts project ID or slug
   - Returns complete project data including GitHub stats
   - Handles not found errors gracefully

3. **searchBlogPosts** - Search technical articles
   - Placeholder implementation (returns empty)
   - Ready for BlogPost model integration
   - Includes test placeholders for future implementation

4. **checkAvailability** - Get current freelance availability
   - Returns availability status (available/limited/unavailable)
   - Includes hourly rate if set
   - Provides contextual message based on status

5. **suggestProposal** - Analyze project requirements
   - Detects budget/timeline/project keywords
   - Returns recommendation with next steps
   - Validates minimum requirement length

#### 3. Error Handling (Section 3.8)

Implements comprehensive fallback strategies:

- **Rate Limiting (429)**: Returns friendly message with retry guidance
- **Service Unavailable (503)**: Provides alternative contact methods
- **Generic Errors**: User-friendly messages without exposing internals
- **Tool Failures**: Graceful degradation with error messages

#### 4. Database Schema

Added `Conversation` model to Prisma schema:
```prisma
model Conversation {
  id           String   @id @default(cuid())
  sessionId    String   @unique
  messages     Json[]   // Array of message objects
  metadata     Json?    // Visitor info, referrer, etc.
  lastActivity DateTime @default(now())
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([sessionId])
  @@index([lastActivity])
}
```

#### 5. WebSocket Integration

- Replaced mock responses in `ChatWebSocketHandler` with AI-powered streaming
- Maintains backward compatibility with existing WebSocket protocol
- Streams responses token by token for real-time user experience
- Handles WebSocket disconnections gracefully

### File Structure

```
packages/agents/
├── src/
│   ├── chat-agent.ts           # Main ChatAgent class
│   ├── index.ts                # Package exports
│   ├── tools/
│   │   ├── searchProjects.ts   # Project search tool
│   │   ├── getProjectDetails.ts # Project details tool
│   │   ├── searchBlogPosts.ts  # Blog search tool
│   │   ├── checkAvailability.ts # Availability check tool
│   │   ├── suggestProposal.ts  # Proposal suggestion tool
│   │   └── index.ts            # Tool exports
│   └── __tests__/
│       ├── chat-agent.test.ts  # ChatAgent tests
│       ├── searchProjects.test.ts
│       ├── getProjectDetails.test.ts
│       ├── checkAvailability.test.ts
│       ├── suggestProposal.test.ts
│       └── searchBlogPosts.test.ts
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── .eslintrc.json
└── README.md                   # Comprehensive documentation
```

## Testing

### Unit Tests

All function tools and the chat agent have comprehensive unit tests:

```bash
# Run all tests
npm test -w packages/agents

# Run with coverage
npm run test:coverage -w packages/agents

# Watch mode
npm run test:watch -w packages/agents
```

**Test Coverage:**
- ✅ searchProjects: 7 test cases covering query/tech filters, errors, limits
- ✅ getProjectDetails: 5 test cases covering ID/slug lookup, not found, errors
- ✅ checkAvailability: 6 test cases covering all availability states, errors
- ✅ suggestProposal: 10 test cases covering validation, keyword detection
- ✅ searchBlogPosts: 3 test cases (placeholder for future implementation)
- ✅ ChatAgent: 12 test cases covering chat, streaming, tools, errors

### Integration Testing

#### Prerequisites

1. **Set Environment Variables**:
   ```bash
   export CLAUDE_API_KEY=your_anthropic_api_key
   export DATABASE_URL=postgresql://user:password@localhost:5432/portfolio
   ```

2. **Run Database Migration**:
   ```bash
   cd apps/api
   npx prisma migrate dev --name add_conversation_model
   npx prisma generate
   ```

3. **Install Dependencies**:
   ```bash
   npm install
   ```

4. **Build Packages**:
   ```bash
   npm run build
   ```

#### Manual Testing via WebSocket

1. **Start the API Server**:
   ```bash
   cd apps/api
   npm run dev
   ```

2. **Connect via WebSocket Client** (e.g., wscat):
   ```bash
   npm install -g wscat
   wscat -c ws://localhost:3001/ws
   ```

3. **Authenticate**:
   ```json
   {"type":"auth","sessionId":"test-session-123"}
   ```

4. **Send Chat Messages**:
   ```json
   {"type":"chat","message":"What projects have you built with React?","sessionId":"test-session-123"}
   ```

5. **Verify Responses**:
   - Should receive streaming tokens: `{"type":"token","content":"..."}`
   - Should see tool calls for searchProjects
   - Should receive done message: `{"type":"done","conversationId":"test-session-123"}`

#### Test Scenarios

**Scenario 1: Project Search**
```json
{"type":"chat","message":"Show me your React projects","sessionId":"scenario-1"}
```
Expected: Agent calls `searchProjects` tool with technologies=["React"]

**Scenario 2: Availability Check**
```json
{"type":"chat","message":"Are you available for freelance work?","sessionId":"scenario-2"}
```
Expected: Agent calls `checkAvailability` tool

**Scenario 3: Project Details**
```json
{"type":"chat","message":"Tell me more about project X","sessionId":"scenario-3"}
```
Expected: Agent calls `getProjectDetails` tool

**Scenario 4: Proposal Suggestion**
```json
{"type":"chat","message":"I need a quote for building an e-commerce site","sessionId":"scenario-4"}
```
Expected: Agent calls `suggestProposal` tool

**Scenario 5: Conversation History**
```json
{"type":"chat","message":"What technologies did we just discuss?","sessionId":"scenario-5"}
```
Expected: Agent references previous messages from history

**Scenario 6: Error Handling**
- Disconnect WebSocket mid-response: Should stop gracefully
- Send invalid JSON: Should return error message
- Rate limit (20+ messages in 10 min): Should return rate limit message

#### Performance Testing

```bash
# Monitor response times
time echo '{"type":"chat","message":"Hello","sessionId":"perf-test"}' | wscat -c ws://localhost:3001/ws

# Test concurrent sessions
for i in {1..5}; do
  wscat -c ws://localhost:3001/ws &
done
```

### Validation Checklist

- [ ] All unit tests pass
- [ ] Build succeeds without TypeScript errors
- [ ] WebSocket connection establishes successfully
- [ ] Chat messages receive AI-powered responses
- [ ] Tool calls execute and return results
- [ ] Conversation history persists across messages
- [ ] Error handling works for rate limits and service errors
- [ ] Streaming responses work in real-time
- [ ] Database migrations apply successfully

## Breaking Changes

None. This is a new feature that enhances the existing WebSocket chat handler without breaking the current protocol.

## Dependencies

**New Dependencies:**
- `@anthropic-ai/sdk`: Claude API integration
- `zod`: Schema validation for tools

**Updated Dependencies:**
- None

## Database Migration Required

⚠️ **Action Required**: Run the database migration to create the `Conversation` table:

```bash
cd apps/api
npx prisma migrate dev --name add_conversation_model
npx prisma generate
```

## Environment Variables Required

⚠️ **Action Required**: Add the following to your `.env` file:

```env
CLAUDE_API_KEY=your_anthropic_api_key_here
```

Get your API key from: https://console.anthropic.com/

## Documentation

- Comprehensive README in `packages/agents/README.md`
- API reference for all tools
- Integration guide for WebSocket handlers
- Architecture documentation explaining conversation flow
- Code comments throughout

## Future Enhancements

The following features are planned but not included in this PR:
- [ ] RAG (Retrieval Augmented Generation) with vector search
- [ ] BlogPost model and full blog search implementation
- [ ] Multi-language support (Portuguese, German)
- [ ] Proposal generator agent (separate PR)
- [ ] GitHub sync agent (separate PR)
- [ ] Cost estimator integration (separate PR)

## Notes

- **Mastra Dependency Removed**: Originally planned to use `@mastra/core`, but encountered installation issues with Prisma binaries. Implemented custom solution using Anthropic SDK directly while following Mastra's architectural patterns.
- **Blog Search Placeholder**: `searchBlogPosts` tool returns empty results until the `BlogPost` model is added to the Prisma schema.
- **Test Mocking**: All tests use mocked dependencies (Prisma, Anthropic SDK) for isolation and speed.

## Checklist

- [x] Code follows project style guidelines (ESLint passes)
- [x] Tests added for all new functionality
- [x] Documentation updated (README, code comments)
- [x] Database schema updated and migration created
- [x] WebSocket integration maintains backward compatibility
- [x] Error handling implements fallback strategies per spec
- [x] All tests pass locally
- [x] TypeScript build succeeds without errors
- [x] Commit message follows conventional commits format

## Related Issues

Implements technical specification Section 3.2: Chat Agent Design

## Screenshots/Demo

Not applicable - this is backend/API functionality. Test via WebSocket client as described in testing section.

---

**Reviewers**: Please ensure you have:
1. Anthropic API key for testing
2. PostgreSQL database running
3. Redis instance running (for existing WebSocket session management)

For questions or issues during testing, please comment on this PR.
