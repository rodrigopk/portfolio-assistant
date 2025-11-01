import Anthropic from '@anthropic-ai/sdk';
import {
  searchProjects,
  searchProjectsTool,
  getProjectDetails,
  getProjectDetailsTool,
  searchBlogPosts,
  searchBlogPostsTool,
  checkAvailability,
  checkAvailabilityTool,
  suggestProposal,
  suggestProposalTool,
} from './tools';
import { getPrismaClient } from './lib/prisma';
import { logger } from './lib/logger';

export const CHAT_SYSTEM_PROMPT = `You are an AI assistant representing Rodrigo Vasconcelos de Barros, a Senior Software Engineer with 8+ years of experience.

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
- For complex projects, suggest generating a detailed proposal`;

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export interface ConversationContext {
  sessionId: string;
  messages: Message[];
  metadata?: Record<string, unknown>;
}

export class ChatAgent {
  private anthropic: Anthropic;
  private model: string;
  private maxMessages: number;

  constructor(apiKey?: string, model = 'claude-3-5-haiku-20241022', maxMessages = 10) {
    this.anthropic = new Anthropic({
      apiKey: apiKey || process.env['CLAUDE_API_KEY'],
    });
    this.model = model;
    this.maxMessages = maxMessages;
  }

  /**
   * Load conversation history from database
   */
  private async loadConversationHistory(sessionId: string): Promise<Message[]> {
    try {
      const prisma = getPrismaClient();
      const conversation = await prisma.conversation.findUnique({
        where: { sessionId },
      });

      if (!conversation) {
        return [];
      }

      // Get last N messages
      const messages = (conversation.messages as Message[]) || [];
      return messages.slice(-this.maxMessages);
    } catch (error) {
      logger.error('Error loading conversation history:', error);
      return [];
    }
  }

  /**
   * Save conversation to database
   */
  private async saveConversation(
    sessionId: string,
    messages: Message[],
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      const prisma = getPrismaClient();
      await prisma.conversation.upsert({
        where: { sessionId },
        create: {
          sessionId,
          messages: messages as unknown[],
          metadata: metadata as unknown,
          lastActivity: new Date(),
        },
        update: {
          messages: messages as unknown[],
          lastActivity: new Date(),
        },
      });
    } catch (error) {
      logger.error('Error saving conversation:', error);
      throw error;
    }
  }

  /**
   * Execute a tool call
   */
  private async executeTool(toolName: string, toolInput: Record<string, unknown>) {
    try {
      switch (toolName) {
        case 'searchProjects':
          return await searchProjects(toolInput as Parameters<typeof searchProjects>[0]);
        case 'getProjectDetails':
          return await getProjectDetails(toolInput as Parameters<typeof getProjectDetails>[0]);
        case 'searchBlogPosts':
          return await searchBlogPosts(toolInput as Parameters<typeof searchBlogPosts>[0]);
        case 'checkAvailability':
          return await checkAvailability(toolInput as Parameters<typeof checkAvailability>[0]);
        case 'suggestProposal':
          return await suggestProposal(toolInput as Parameters<typeof suggestProposal>[0]);
        default:
          return { error: `Unknown tool: ${toolName}` };
      }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Tool execution failed',
      };
    }
  }

  /**
   * Send a chat message and get a response
   */
  async chat(
    userMessage: string,
    sessionId: string,
    metadata?: Record<string, unknown>
  ): Promise<{
    response: string;
    sessionId: string;
  }> {
    try {
      // Load conversation history
      const history = await this.loadConversationHistory(sessionId);

      // Add user message to history
      const userMsg: Message = {
        role: 'user',
        content: userMessage,
        timestamp: new Date(),
      };
      history.push(userMsg);

      // Prepare messages for Claude
      const messages = history.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Make API call to Claude with tool support
      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 4096,
        system: CHAT_SYSTEM_PROMPT,
        messages,
        tools: [
          searchProjectsTool,
          getProjectDetailsTool,
          searchBlogPostsTool,
          checkAvailabilityTool,
          suggestProposalTool,
        ],
      });

      // Process response and handle tool calls
      let finalResponse = '';
      const toolResults: Array<{
        type: 'tool_result';
        tool_use_id: string;
        content: string;
      }> = [];

      for (const block of response.content) {
        if (block.type === 'text') {
          finalResponse += block.text;
        } else if (block.type === 'tool_use') {
          // Execute the tool
          const toolResult = await this.executeTool(block.name, block.input as Record<string, unknown>);
          toolResults.push({
            type: 'tool_result' as const,
            tool_use_id: block.id,
            content: JSON.stringify(toolResult),
          });
        }
      }

      // If there were tool calls, make another API call to get the final response
      if (toolResults.length > 0) {
        const followUpResponse = await this.anthropic.messages.create({
          model: this.model,
          max_tokens: 4096,
          system: CHAT_SYSTEM_PROMPT,
          messages: [
            ...messages,
            {
              role: 'assistant',
              content: response.content,
            },
            {
              role: 'user',
              content: toolResults,
            },
          ],
        });

        // Extract text from follow-up response
        finalResponse = '';
        for (const block of followUpResponse.content) {
          if (block.type === 'text') {
            finalResponse += block.text;
          }
        }
      }

      // Add assistant message to history
      const assistantMsg: Message = {
        role: 'assistant',
        content: finalResponse,
        timestamp: new Date(),
      };
      history.push(assistantMsg);

      // Save conversation
      await this.saveConversation(sessionId, history, metadata);

      return {
        response: finalResponse,
        sessionId,
      };
    } catch (error) {
      // Handle errors according to section 3.8
      // Check for status property (works for both real and mocked APIError)
      const isAPIError = error instanceof Anthropic.APIError || (error && typeof error === 'object' && 'status' in error);

      if (isAPIError) {
        const status = (error as { status?: number }).status;

        if (status === 429) {
          // Rate limiting
          return {
            response:
              "I'm experiencing high demand right now. Please try again in a moment. In the meantime, feel free to explore the portfolio or contact Rodrigo directly.",
            sessionId,
          };
        } else if (status === 503) {
          // Service unavailable
          return {
            response:
              "I'm temporarily unavailable. You can still reach Rodrigo at his email or LinkedIn. I'll be back shortly!",
            sessionId,
          };
        }
      }

      logger.error('Chat error:', error);
      return {
        response:
          "I encountered an error processing your message. Please try rephrasing your question, or contact Rodrigo directly for assistance.",
        sessionId,
      };
    }
  }

  /**
   * Stream a chat response (for WebSocket integration)
   */
  async *chatStream(
    userMessage: string,
    sessionId: string,
    metadata?: Record<string, unknown>
  ): AsyncGenerator<string, void, unknown> {
    try {
      // Load conversation history
      const history = await this.loadConversationHistory(sessionId);

      // Add user message to history
      const userMsg: Message = {
        role: 'user',
        content: userMessage,
        timestamp: new Date(),
      };
      history.push(userMsg);

      // Prepare messages for Claude
      const messages = history.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Make streaming API call to Claude
      const stream = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 4096,
        system: CHAT_SYSTEM_PROMPT,
        messages,
        tools: [
          searchProjectsTool,
          getProjectDetailsTool,
          searchBlogPostsTool,
          checkAvailabilityTool,
          suggestProposalTool,
        ],
        stream: true,
      });

      let fullResponse = '';
      const toolCalls: Array<{ id: string; name: string; input: Record<string, unknown> }> = [];

      for await (const event of stream) {
        if (event.type === 'content_block_delta') {
          if (event.delta.type === 'text_delta') {
            fullResponse += event.delta.text;
            yield event.delta.text;
          }
        } else if (event.type === 'content_block_start') {
          if (event.content_block.type === 'tool_use') {
            toolCalls.push({
              id: event.content_block.id,
              name: event.content_block.name,
              input: event.content_block.input as Record<string, unknown>,
            });
          }
        }
      }

      // Execute any tool calls and get final response
      if (toolCalls.length > 0) {
        const toolResults = await Promise.all(
          toolCalls.map(async (call) => ({
            type: 'tool_result' as const,
            tool_use_id: call.id,
            content: JSON.stringify(await this.executeTool(call.name, call.input)),
          }))
        );

        // Get final response after tool execution
        const followUpStream = await this.anthropic.messages.create({
          model: this.model,
          max_tokens: 4096,
          system: CHAT_SYSTEM_PROMPT,
          messages: [
            ...messages,
            { role: 'assistant', content: fullResponse },
            { role: 'user', content: toolResults },
          ],
          stream: true,
        });

        fullResponse = '';
        for await (const event of followUpStream) {
          if (event.type === 'content_block_delta') {
            if (event.delta.type === 'text_delta') {
              fullResponse += event.delta.text;
              yield event.delta.text;
            }
          }
        }
      }

      // Save conversation
      history.push({
        role: 'assistant',
        content: fullResponse,
        timestamp: new Date(),
      });
      await this.saveConversation(sessionId, history, metadata);
    } catch (error) {
      logger.error('Chat stream error:', error);
      yield "I'm sorry, I encountered an error. Please try again.";
    }
  }
}

export default ChatAgent;
