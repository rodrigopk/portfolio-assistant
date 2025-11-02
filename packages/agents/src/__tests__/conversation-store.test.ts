import { describe, it, expect, vi } from 'vitest';

// Mock the database repository before any imports
const mockRepository = {
  getMessages: vi.fn(),
  addMessage: vi.fn(),
};

vi.mock('@portfolio/database', () => ({
  ConversationRepository: vi.fn().mockImplementation(() => mockRepository),
}));

// Mock the logger
vi.mock('../lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Import after mocking
import { loadConversationHistory, saveConversation } from '../utils/conversation-store';
import type { Message } from '../chat-agent';

describe('Conversation Store', () => {
  describe('loadConversationHistory', () => {
    it('should load and filter conversation messages successfully', async () => {
      const sessionId = 'test-session-123';
      const maxMessages = 10;

      const mockMessages = [
        {
          role: 'user',
          content: 'Hello',
          timestamp: new Date('2023-01-01'),
        },
        {
          role: 'assistant',
          content: 'Hi there!',
          timestamp: new Date('2023-01-02'),
        },
        {
          role: 'system',
          content: 'System message',
          timestamp: new Date('2023-01-03'),
        },
      ];

      mockRepository.getMessages.mockResolvedValueOnce(mockMessages);

      const result = await loadConversationHistory(null, sessionId, maxMessages);

      expect(result).toHaveLength(2); // Only user and assistant messages
      expect(result[0]).toEqual({
        role: 'user',
        content: 'Hello',
        timestamp: new Date('2023-01-01'),
      });
    });

    it('should return empty array when repository throws error', async () => {
      const sessionId = 'test-session-123';
      const maxMessages = 10;

      mockRepository.getMessages.mockRejectedValueOnce(new Error('Database error'));

      const result = await loadConversationHistory(null, sessionId, maxMessages);

      expect(result).toEqual([]);
    });
  });

  describe('saveConversation', () => {
    it('should handle empty messages array', async () => {
      const sessionId = 'test-session-123';
      const messages: Message[] = [];

      await saveConversation(null, sessionId, messages);

      const { logger } = await import('../lib/logger');
      expect(logger.info).toHaveBeenCalled();
    });
  });
});
