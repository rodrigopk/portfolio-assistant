# Example Development Workflow with Claude Code

This document shows a real-world example of using the documentation suite to implement a feature from start to finish.

---

## Scenario: Implementing the Chat Feature

**Goal**: Build the complete AI chat functionality including backend, frontend, and AI agent.

**Time estimate**: 4-6 hours

---

## Step 1: Understanding the Requirements (15 minutes)

### What you do:
1. Open `TECHNICAL_DOCUMENTATION.md`
2. Read these sections:
   - Section 3.2: Chat Agent design
   - Section 5.1.3: Chat API endpoint
   - Section 5.2: WebSocket API
   - Section 6.1: ChatWidget component hierarchy

### What you learn:
- Chat uses WebSocket for real-time communication
- Agent has 5 function tools (searchProjects, etc.)
- Messages stream token-by-token
- Rate limit: 20 requests per 10 minutes
- Session-based conversation history

---

## Step 2: Backend WebSocket Setup (45 minutes)

### Prompt to Claude Code:

```
Based on TECHNICAL_DOCUMENTATION.md sections 5.1.3 and 5.2, implement the chat WebSocket functionality:

1. Set up WebSocket server using ws library
2. Implement the message types from section 5.2.2:
   - Client: chat, typing, ping
   - Server: token, done, error, pong
3. Add session management and authentication
4. Implement rate limiting (20 requests per 10 minutes per session) from section 5.4
5. Add proper error handling and reconnection logic
6. Create integration tests for WebSocket communication
7. Add TypeScript types for all message formats

Structure:
- apps/api/src/websocket/chat.handler.ts
- apps/api/src/websocket/session.manager.ts
- apps/api/src/websocket/types.ts
- apps/api/src/__tests__/websocket.test.ts

For now, create a mock response handler that echoes messages back.
We'll integrate the Mastra agent in the next step.
```

### What Claude Code does:
1. Creates the file structure
2. Implements WebSocket server
3. Adds session management with Redis
4. Implements rate limiting
5. Creates comprehensive tests
6. Adds TypeScript types

### Verification:

```
Please verify this implementation matches sections 5.1.3 and 5.2:
1. All message types from section 5.2.2 are implemented
2. Rate limiting follows section 5.4 exactly
3. Error handling is comprehensive
4. Tests cover all message types
5. TypeScript types are complete

Run the tests and report results.
```

**Expected output**: All tests pass, WebSocket server works with mock responses.

---

## Step 3: AI Agent Implementation (90 minutes)

### Prompt to Claude Code:

```
Following TECHNICAL_DOCUMENTATION.md section 3.2, implement the Chat Agent:

1. Create packages/agents/ workspace if it doesn't exist
2. Install Mastra framework and Anthropic SDK
3. Implement the Chat Agent exactly as shown in section 3.2.5
4. Create all function tools from section 3.2.3:
   - searchProjects(query, technologies)
   - getProjectDetails(projectId)
   - searchBlogPosts(topic)
   - checkAvailability()
   - suggestProposal(requirements)
5. Implement the system prompt from section 3.2.2
6. Set up conversation history storage in PostgreSQL (last 10 messages)
7. Add context management
8. Create proper TypeScript types for all functions
9. Add error handling and fallbacks from section 3.8
10. Write unit tests for each function tool

Structure:
- packages/agents/src/chat-agent.ts
- packages/agents/src/tools/search-projects.ts
- packages/agents/src/tools/get-project-details.ts
- packages/agents/src/tools/search-blog-posts.ts
- packages/agents/src/tools/check-availability.ts
- packages/agents/src/tools/suggest-proposal.ts
- packages/agents/src/__tests__/chat-agent.test.ts
- packages/agents/src/__tests__/tools/

Please implement each tool with its own test file.
```

### What Claude Code does:
1. Sets up Mastra agent configuration
2. Implements all 5 function tools
3. Connects to Claude API
4. Adds conversation history management
5. Creates comprehensive test suite
6. Integrates with Prisma for database queries

### Integration Prompt:

```
Now integrate the Chat Agent with the WebSocket handler:

1. Import the chatAgent from packages/agents
2. Replace the mock handler in chat.handler.ts
3. Stream the agent's response tokens to the WebSocket client
4. Handle function calls and send results
5. Save conversation history after each exchange
6. Add error handling for AI service failures (fallback from section 3.8)
7. Update tests to verify agent integration

Ensure streaming works properly and tokens are sent as they arrive.
```

### Verification:

```
Test the complete chat flow:
1. Client sends message via WebSocket
2. Agent processes with function tools
3. Response streams back token by token
4. Conversation saved to database
5. Rate limiting works
6. Error handling works (simulate AI failure)

Run all tests and report coverage.
```

**Expected output**: Full chat flow works, tests pass, coverage >80%.

---

## Step 4: Frontend Chat Widget (90 minutes)

### Prompt to Claude Code:

```
Based on TECHNICAL_DOCUMENTATION.md section 6.1, create the ChatWidget:

1. Implement the component hierarchy:
   - ChatWidget (wrapper)
   - ChatButton (open/close button)
   - ChatWindow (chat interface)
   - MessageList (displays messages)
   - Message (individual message bubble)
   - MessageInput (text input)
   - SuggestedQuestions (quick prompts)

2. Set up WebSocket connection using the API from section 5.2
3. Create ChatContext from section 6.2.2 for state management:
   - isOpen, setIsOpen
   - messages, setMessages
   - sessionId
   - isConnected
   - isTyping
   - error

4. Implement message streaming display:
   - Show tokens as they arrive
   - Handle complete messages
   - Display function calls (e.g., "Searching projects...")
   - Show errors

5. Lazy load the component as shown in section 6.4.1
6. Add proper accessibility:
   - Keyboard navigation (Escape to close, Enter to send)
   - ARIA labels
   - Focus management

7. Style with TailwindCSS:
   - Responsive design (mobile-first)
   - Smooth animations with Framer Motion
   - Clean, modern UI

8. Handle connection lifecycle:
   - Auto-reconnect on disconnect
   - Show connection status
   - Queue messages while offline

Create:
- apps/web/src/widgets/ChatWidget/index.tsx
- apps/web/src/widgets/ChatWidget/ChatButton.tsx
- apps/web/src/widgets/ChatWidget/ChatWindow.tsx
- apps/web/src/widgets/ChatWidget/MessageList.tsx
- apps/web/src/widgets/ChatWidget/Message.tsx
- apps/web/src/widgets/ChatWidget/MessageInput.tsx
- apps/web/src/widgets/ChatWidget/SuggestedQuestions.tsx
- apps/web/src/contexts/ChatContext.tsx
- apps/web/src/hooks/useChat.ts
- apps/web/src/hooks/useWebSocket.ts
```

### What Claude Code does:
1. Creates complete component hierarchy
2. Implements WebSocket hook with reconnection
3. Adds ChatContext for state management
4. Creates smooth streaming UI
5. Adds accessibility features
6. Implements responsive design
7. Adds animations

### Styling Prompt:

```
Improve the ChatWidget styling:

1. ChatButton:
   - Fixed bottom-right position
   - Floating action button style
   - Pulse animation when new message
   - Badge showing unread count

2. ChatWindow:
   - Slide-in animation from bottom-right
   - Modern card design with shadow
   - Fixed size on desktop (400x600px)
   - Full screen on mobile
   - Header with title and close button

3. Messages:
   - User messages: right-aligned, blue background
   - Agent messages: left-aligned, gray background
   - Streaming indicator (dots animation)
   - Timestamps
   - Smooth scroll to bottom

4. Input:
   - Fixed at bottom
   - Auto-resize textarea
   - Send button (disabled while sending)
   - Character limit indicator

5. Overall:
   - Professional, clean design
   - Smooth transitions
   - Loading states
   - Error states (red toast notifications)

Use TailwindCSS utilities and Framer Motion for animations.
```

### Verification:

```
Test the ChatWidget:
1. Opens/closes smoothly
2. Connects to WebSocket
3. Sends messages
4. Displays streaming responses
5. Shows function calls (e.g., "Searching projects...")
6. Handles errors gracefully
7. Reconnects automatically
8. Works on mobile and desktop
9. Keyboard navigation works
10. Accessible with screen reader

Run component tests and manual test in browser.
```

**Expected output**: Fully functional, beautiful chat widget.

---

## Step 5: Integration Testing (30 minutes)

### Prompt to Claude Code:

```
Create end-to-end integration test for the chat feature:

1. Test complete flow:
   - User opens chat widget
   - Sends message: "Show me your React projects"
   - Agent calls searchProjects function
   - Agent responds with project list
   - User clicks on a project suggestion
   - Agent provides details
   - Conversation saved to database

2. Test error scenarios:
   - WebSocket disconnection
   - AI service timeout
   - Rate limit exceeded
   - Invalid session

3. Test edge cases:
   - Very long messages
   - Rapid message sending
   - Multiple concurrent sessions
   - Message history pagination

Use a test framework that can:
- Start WebSocket server
- Mock AI responses
- Interact with React components
- Verify database state

Create test file:
- apps/api/src/__tests__/integration/chat-e2e.test.ts
```

### Verification:

```
Run all tests for the chat feature:
1. Backend unit tests (WebSocket, session management)
2. Agent unit tests (all function tools)
3. Agent integration tests (with mocked Claude API)
4. Frontend component tests (React Testing Library)
5. E2E integration tests

Report:
- Total tests run
- Pass/fail status
- Coverage percentage
- Any failures or warnings
```

**Expected output**: All tests pass, coverage >80%.

---

## Step 6: Manual Testing & Polish (30 minutes)

### Checklist:

```
Manual testing checklist:

Backend:
□ WebSocket connects successfully
□ Sessions are tracked correctly
□ Rate limiting works (test with 21 requests)
□ Conversation history persists
□ Agent responds appropriately
□ Function tools return correct data
□ Error handling works (disconnect, timeout)

Frontend:
□ Chat button is visible and positioned correctly
□ Widget opens/closes smoothly
□ Messages send and receive correctly
□ Streaming displays properly
□ Suggested questions work
□ Mobile responsive (test on small screen)
□ Keyboard navigation works (Tab, Enter, Escape)
□ Reconnection works (kill server and restart)

User Experience:
□ Response time feels fast (<2 seconds)
□ UI is intuitive
□ Error messages are helpful
□ Loading states are clear
□ Animations are smooth (not janky)

Test these scenarios:
1. "What technologies do you know?"
2. "Show me your best projects"
3. "Tell me about your Rails experience"
4. "Are you available for work?"
5. "I need a React app built, can you help?"
```

### Polish Prompt:

```
Based on manual testing, polish the chat feature:

1. Improve response times:
   - Add request caching for common queries
   - Optimize database queries
   - Preload common data

2. Enhance UX:
   - Add typing indicator when agent is thinking
   - Show better loading states
   - Improve error messages
   - Add success feedback

3. Fix any bugs found during testing

4. Add final touches:
   - Welcome message when chat opens
   - Help text if user seems confused
   - "Was this helpful?" feedback buttons
   - Better suggested questions

Maintain all existing tests and ensure they still pass.
```

---

## Step 7: Documentation & Deployment (15 minutes)

### Update Documentation:

```
Update the project documentation:

1. Add chat feature to README:
   - How to use the chat
   - Available commands
   - Tips for best results

2. Update API documentation:
   - WebSocket endpoints
   - Message formats
   - Rate limits

3. Add troubleshooting section:
   - Common issues
   - How to debug
   - Connection problems

4. Update CHANGELOG:
   - Version bump
   - New feature: AI Chat
   - Breaking changes: none
```

### Deploy:

```
Following TECHNICAL_DOCUMENTATION.md section 8, prepare for deployment:

1. Build Docker images
2. Run production build
3. Verify environment variables
4. Test in staging environment
5. Run smoke tests
6. Deploy to production
7. Monitor logs and metrics

Create deployment checklist and verify each step.
```

---

## Final Result

After following this workflow, you have:

✅ **Backend**:
- WebSocket server with session management
- Rate limiting and error handling
- Comprehensive test coverage

✅ **AI Agent**:
- Mastra-powered chat agent
- 5 function tools for portfolio queries
- Conversation history
- Fallback handling

✅ **Frontend**:
- Beautiful, responsive chat widget
- Real-time message streaming
- Smooth animations
- Accessible interface

✅ **Testing**:
- Unit tests for all components
- Integration tests for full flow
- E2E tests for user scenarios
- 80%+ code coverage

✅ **Documentation**:
- Updated README
- API documentation
- Troubleshooting guide

✅ **Production Ready**:
- Deployed and monitored
- Error tracking configured
- Performance optimized

---

## Time Breakdown

| Phase | Time | What You Did |
|-------|------|--------------|
| Understanding | 15 min | Read documentation |
| Backend WebSocket | 45 min | Implement + test |
| AI Agent | 90 min | Mastra setup + tools |
| Frontend Widget | 90 min | React components + styling |
| Integration Testing | 30 min | E2E tests |
| Manual Testing | 30 min | QA and polish |
| Documentation | 15 min | Update docs |
| **Total** | **5 hours** | Complete feature! |

---

## Key Takeaways

1. **Documentation is your guide**: Every decision referenced TECHNICAL_DOCUMENTATION.md
2. **Prompts are specific**: Each prompt included exact requirements and file structure
3. **Verification is crucial**: After each step, verify against specs and run tests
4. **Iterate and polish**: Build → Test → Polish → Deploy
5. **AI is powerful**: Claude Code implemented hundreds of lines of code accurately

---

## What's Next?

Use this same workflow for other features:

- **Proposal Generator** (Section 3.3): ~4 hours
- **Cost Estimator** (Section 3.6): ~3 hours
- **GitHub Sync** (Section 3.4): ~3 hours
- **Blog Generator** (Section 3.5): ~4 hours
- **RAG System** (Section 3.7): ~6 hours

Follow the recommended order in README.md for optimal results!

---

**Pro Tip**: Save your successful prompts and results. Build your own library of what works best for your project and coding style.
