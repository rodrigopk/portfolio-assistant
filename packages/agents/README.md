# @portfolio/agents

AI-powered chat agent for the DevPortfolio AI project, implementing conversation management and portfolio assistance functionality.

## Overview

This package provides a chat agent built with Anthropic's Claude API that serves as an intelligent assistant for portfolio visitors. The agent can:

- Answer questions about Rodrigo's experience and skills
- Search and recommend relevant portfolio projects
- Check current availability for freelance work
- Suggest generating detailed proposals for projects
- Maintain conversation history with context

## Features

### Chat Agent

The main `ChatAgent` class provides:

- **Streaming responses**: Real-time token-by-token response generation
- **Conversation history**: Stores and retrieves last 10 messages from PostgreSQL
- **Tool calling**: Executes function tools to fetch dynamic data
- **Error handling**: Graceful fallbacks for rate limits and service errors

### Function Tools

Five specialized tools enhance the agent's capabilities:

1. **searchProjects**: Find portfolio projects by query or technologies
2. **getProjectDetails**: Retrieve full project information by ID or slug
3. **searchBlogPosts**: Search for related technical articles (coming soon)
4. **checkAvailability**: Get current freelance availability status
5. **suggestProposal**: Analyze requirements and recommend proposal generation

## Installation

This package is part of the monorepo and uses workspace dependencies:

```bash
npm install
```

## Usage

### Basic Chat

```typescript
import { ChatAgent } from '@portfolio/agents';

const agent = new ChatAgent(
  process.env.CLAUDE_API_KEY,
  'claude-3-5-haiku-20241022',
  10 // max messages in history
);

const response = await agent.chat(
  'What projects have you built with React?',
  'session-123'
);

console.log(response.response);
```

### Streaming Chat (for WebSocket)

```typescript
import { ChatAgent } from '@portfolio/agents';

const agent = new ChatAgent();

for await (const token of agent.chatStream('Tell me about your experience', 'session-456')) {
  // Send token to WebSocket client
  ws.send(JSON.stringify({ type: 'token', content: token }));
}
```

### Using Individual Tools

```typescript
import { searchProjects, checkAvailability } from '@portfolio/agents';

// Search for projects
const projects = await searchProjects({
  query: 'e-commerce',
  technologies: ['React', 'Node.js'],
});

// Check availability
const availability = await checkAvailability({});
console.log(availability.message);
```

## API Reference

### ChatAgent

#### Constructor

```typescript
constructor(
  apiKey?: string,           // Anthropic API key (defaults to CLAUDE_API_KEY env var)
  model?: string,            // Claude model (defaults to claude-3-5-haiku-20241022)
  maxMessages?: number       // Max messages in history (defaults to 10)
)
```

#### Methods

##### chat(userMessage, sessionId, metadata?)

Send a message and get a complete response.

**Parameters:**
- `userMessage: string` - The user's message
- `sessionId: string` - Unique session identifier
- `metadata?: object` - Optional metadata to store with conversation

**Returns:** `Promise<{ response: string, sessionId: string }>`

##### chatStream(userMessage, sessionId, metadata?)

Send a message and stream the response token by token.

**Parameters:**
- Same as `chat()`

**Returns:** `AsyncGenerator<string>` - Async iterator yielding tokens

### Tools

All tools return a result object with:
- `success: boolean` - Whether the operation succeeded
- Additional fields specific to each tool

See individual tool files in `src/tools/` for detailed schemas.

## Configuration

### Environment Variables

```bash
CLAUDE_API_KEY=your_anthropic_api_key
DATABASE_URL=postgresql://user:password@localhost:5432/portfolio
```

### System Prompt

The agent uses a pre-configured system prompt that represents Rodrigo's background and expertise. See `CHAT_SYSTEM_PROMPT` in `src/chat-agent.ts`.

## Testing

Run the test suite:

```bash
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage report
```

## Architecture

### Conversation Flow

1. User sends message via WebSocket
2. Agent loads last 10 messages from database
3. Messages sent to Claude API with system prompt and tools
4. Claude may call tools to fetch data (projects, availability, etc.)
5. Tool results sent back to Claude for final response
6. Response streamed to user token by token
7. Conversation saved to database

### Error Handling

The agent implements fallback strategies per section 3.8 of the technical specification:

- **Rate limiting (429)**: Returns helpful message with retry guidance
- **Service unavailable (503)**: Provides alternative contact methods
- **Generic errors**: Graceful error messages without exposing internals

### Database Schema

Conversations are stored in the `Conversation` model:

```prisma
model Conversation {
  id           String   @id @default(cuid())
  sessionId    String   @unique
  messages     Json[]   // Array of message objects
  metadata     Json?
  lastActivity DateTime @default(now())
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

## Integration

### WebSocket Handler

The chat agent is integrated with the WebSocket handler in `apps/api/src/websocket/chat.handler.ts`:

```typescript
import { ChatAgent } from '@portfolio/agents';

class ChatWebSocketHandler {
  private chatAgent: ChatAgent;

  constructor(wss: WebSocketServer) {
    this.chatAgent = new ChatAgent();
    // ...
  }

  private async generateAIResponse(ws: WebSocket, message: string, sessionId: string) {
    const stream = this.chatAgent.chatStream(message, sessionId);

    for await (const token of stream) {
      this.sendMessage(ws, { type: 'token', content: token });
    }

    this.sendMessage(ws, { type: 'done', conversationId: sessionId });
  }
}
```

## Development

### Building

```bash
npm run build        # Compile TypeScript
npm run dev          # Watch mode
```

### Linting

```bash
npm run lint         # Check for issues
npm run lint:fix     # Auto-fix issues
```

### Type Checking

```bash
npm run typecheck    # Type check without emitting files
```

## Future Enhancements

- [ ] RAG (Retrieval Augmented Generation) with vector search
- [ ] Multi-language support (Portuguese, German)
- [ ] Proposal generator agent
- [ ] GitHub sync agent
- [ ] Blog post generator agent
- [ ] Cost estimator integration

## License

MIT
