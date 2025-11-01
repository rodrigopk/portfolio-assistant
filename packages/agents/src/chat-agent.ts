import Anthropic from '@anthropic-ai/sdk';
import { CHAT_SYSTEM_PROMPT } from './prompts/system';
import { handleChatError, handleStreamError } from './utils/error-handler';
import { AGENT_TOOLS, executeTool, processToolCalls, type ToolResult } from './utils/tool-executor';
import { formatMessagesForClaude, createMessage } from './utils/message-formatter';
import { loadConversationHistory, saveConversation } from './utils/conversation-store';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
  [key: string]: unknown; // Add index signature for JSON compatibility
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
      const history = await loadConversationHistory(null, sessionId, this.maxMessages);

      // Add user message to history
      const userMsg = createMessage('user', userMessage);
      history.push(userMsg);

      // Prepare messages for Claude
      const messages = formatMessagesForClaude(history);

      // Make API call to Claude with tool support
      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 4096,
        system: CHAT_SYSTEM_PROMPT,
        messages,
        tools: AGENT_TOOLS,
      });

      // Process response and handle tool calls
      let finalResponse = '';
      const toolResults: ToolResult[] = [];

      for (const block of response.content) {
        if (block.type === 'text') {
          finalResponse += block.text;
        } else if (block.type === 'tool_use') {
          // Execute the tool
          const toolResult = await executeTool(block.name, block.input as Record<string, unknown>);
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
      const assistantMsg = createMessage('assistant', finalResponse);
      history.push(assistantMsg);

      // Save final conversation
      await saveConversation(null, sessionId, history, metadata);

      return {
        response: finalResponse,
        sessionId,
      };
    } catch (error) {
      return handleChatError(error, sessionId);
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
      const history = await loadConversationHistory(null, sessionId, this.maxMessages);

      // Add user message to history
      const userMsg = createMessage('user', userMessage);
      history.push(userMsg);

      // Prepare messages for Claude
      const messages = formatMessagesForClaude(history);

      // Make streaming API call to Claude
      const stream = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 4096,
        system: CHAT_SYSTEM_PROMPT,
        messages,
        tools: AGENT_TOOLS,
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
        const toolResults = await processToolCalls(toolCalls);

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
      history.push(createMessage('assistant', fullResponse));
      await saveConversation(null, sessionId, history, metadata);
    } catch (error) {
      yield* handleStreamError(error);
    }
  }
}

export default ChatAgent;
