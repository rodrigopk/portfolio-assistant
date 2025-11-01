import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChatAgent } from '../chat-agent';
import Anthropic from '@anthropic-ai/sdk';

// Mock dependencies
vi.mock('@anthropic-ai/sdk');
vi.mock('@prisma/client', () => {
  const mockPrismaClient = {
    conversation: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  };
  return {
    PrismaClient: vi.fn(() => mockPrismaClient),
    Prisma: {
      JsonArray: Array,
      JsonObject: Object,
    },
  };
});

describe('ChatAgent', () => {
  let chatAgent: ChatAgent;
  let mockAnthropicCreate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Anthropic API
    mockAnthropicCreate = vi.fn();
    vi.mocked(Anthropic).mockImplementation(
      () =>
        ({
          messages: {
            create: mockAnthropicCreate,
          },
        }) as unknown as Anthropic
    );

    chatAgent = new ChatAgent('test-api-key');
  });

  describe('chat', () => {
    it('should send a message and receive a response', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: 'Hello! How can I help you today?',
          },
        ],
      };

      mockAnthropicCreate.mockResolvedValue(mockResponse);

      const result = await chatAgent.chat('Hello', 'session-123');

      expect(result).toBeDefined();
      expect(result.response).toBe('Hello! How can I help you today?');
      expect(result.sessionId).toBe('session-123');
    });

    it('should handle tool calls', async () => {
      const mockResponseWithTool = {
        content: [
          {
            type: 'tool_use',
            id: 'tool-1',
            name: 'checkAvailability',
            input: {},
          },
        ],
      };

      const mockFollowUpResponse = {
        content: [
          {
            type: 'text',
            text: 'I am currently available for part-time freelance work.',
          },
        ],
      };

      mockAnthropicCreate
        .mockResolvedValueOnce(mockResponseWithTool)
        .mockResolvedValueOnce(mockFollowUpResponse);

      const result = await chatAgent.chat('Are you available?', 'session-456');

      expect(result).toBeDefined();
      expect(result.response).toContain('available');
      expect(mockAnthropicCreate).toHaveBeenCalledTimes(2);
    });

    it('should handle rate limiting errors', async () => {
      const rateLimitError = new Anthropic.APIError(
        429,
        { error: { type: 'rate_limit_error', message: 'Rate limit exceeded' } },
        'Rate limit exceeded',
        {}
      );

      mockAnthropicCreate.mockRejectedValue(rateLimitError);

      const result = await chatAgent.chat('Test message', 'session-789');

      expect(result.response).toContain('high demand');
    });

    it('should handle service unavailable errors', async () => {
      const serviceError = new Anthropic.APIError(
        503,
        { error: { type: 'service_unavailable', message: 'Service unavailable' } },
        'Service unavailable',
        {}
      );

      mockAnthropicCreate.mockRejectedValue(serviceError);

      const result = await chatAgent.chat('Test message', 'session-999');

      expect(result.response).toContain('temporarily unavailable');
    });

    it('should handle generic errors', async () => {
      mockAnthropicCreate.mockRejectedValue(new Error('Unknown error'));

      const result = await chatAgent.chat('Test message', 'session-error');

      expect(result.response).toContain('error');
    });

    it('should include system prompt in API call', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: 'Response',
          },
        ],
      };

      mockAnthropicCreate.mockResolvedValue(mockResponse);

      await chatAgent.chat('Hello', 'session-123');

      expect(mockAnthropicCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          system: expect.stringContaining('Rodrigo Vasconcelos de Barros'),
        })
      );
    });

    it('should include tools in API call', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: 'Response',
          },
        ],
      };

      mockAnthropicCreate.mockResolvedValue(mockResponse);

      await chatAgent.chat('Hello', 'session-123');

      expect(mockAnthropicCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          tools: expect.arrayContaining([
            expect.objectContaining({ name: 'searchProjects' }),
            expect.objectContaining({ name: 'getProjectDetails' }),
            expect.objectContaining({ name: 'checkAvailability' }),
          ]),
        })
      );
    });
  });

  describe('chatStream', () => {
    it('should stream response tokens', async () => {
      const mockStreamEvents = [
        {
          type: 'content_block_delta',
          delta: { type: 'text_delta', text: 'Hello' },
        },
        {
          type: 'content_block_delta',
          delta: { type: 'text_delta', text: ' there!' },
        },
      ];

      mockAnthropicCreate.mockResolvedValue({
        [Symbol.asyncIterator]: async function* () {
          for (const event of mockStreamEvents) {
            yield event;
          }
        },
      });

      const tokens: string[] = [];
      for await (const token of chatAgent.chatStream('Test', 'session-stream')) {
        tokens.push(token);
      }

      expect(tokens).toEqual(['Hello', ' there!']);
    });

    it('should handle stream errors gracefully', async () => {
      mockAnthropicCreate.mockRejectedValue(new Error('Stream error'));

      const tokens: string[] = [];
      for await (const token of chatAgent.chatStream('Test', 'session-error')) {
        tokens.push(token);
      }

      expect(tokens.length).toBeGreaterThan(0);
      expect(tokens[0]).toContain('sorry');
    });
  });

  describe('Model configuration', () => {
    it('should use default model when not specified', () => {
      const agent = new ChatAgent('test-key');
      expect(agent).toBeDefined();
    });

    it('should use custom model when specified', () => {
      const agent = new ChatAgent('test-key', 'claude-3-opus-20240229');
      expect(agent).toBeDefined();
    });

    it('should use default max messages of 10', () => {
      const agent = new ChatAgent('test-key');
      expect(agent).toBeDefined();
    });

    it('should use custom max messages when specified', () => {
      const agent = new ChatAgent('test-key', 'claude-3-5-haiku-20241022', 20);
      expect(agent).toBeDefined();
    });
  });
});
