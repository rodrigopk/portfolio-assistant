import { describe, it, expect } from 'vitest';
import { formatMessagesForClaude, createMessage, limitConversationHistory } from '../utils/message-formatter';
import type { Message } from '../chat-agent';

describe('message-formatter', () => {
  describe('formatMessagesForClaude', () => {
    it('should format messages for Claude API', () => {
      const messages: Message[] = [
        { role: 'user', content: 'Hello', timestamp: new Date() },
        { role: 'assistant', content: 'Hi there!', timestamp: new Date() },
      ];

      const formatted = formatMessagesForClaude(messages);

      expect(formatted).toEqual([
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
      ]);
    });

    it('should handle empty messages array', () => {
      const formatted = formatMessagesForClaude([]);
      expect(formatted).toEqual([]);
    });
  });

  describe('createMessage', () => {
    it('should create a user message with timestamp', () => {
      const now = new Date();
      const message = createMessage('user', 'Hello', now);

      expect(message).toEqual({
        role: 'user',
        content: 'Hello',
        timestamp: now,
      });
    });

    it('should create an assistant message with auto timestamp', () => {
      const message = createMessage('assistant', 'Hi there!');

      expect(message.role).toBe('assistant');
      expect(message.content).toBe('Hi there!');
      expect(message.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('limitConversationHistory', () => {
    it('should limit messages to maxMessages', () => {
      const messages: Message[] = [
        { role: 'user', content: 'Message 1' },
        { role: 'assistant', content: 'Response 1' },
        { role: 'user', content: 'Message 2' },
        { role: 'assistant', content: 'Response 2' },
        { role: 'user', content: 'Message 3' },
      ];

      const limited = limitConversationHistory(messages, 3);

      expect(limited).toHaveLength(3);
      expect(limited).toEqual([
        { role: 'user', content: 'Message 2' },
        { role: 'assistant', content: 'Response 2' },
        { role: 'user', content: 'Message 3' },
      ]);
    });

    it('should return all messages if under limit', () => {
      const messages: Message[] = [
        { role: 'user', content: 'Message 1' },
        { role: 'assistant', content: 'Response 1' },
      ];

      const limited = limitConversationHistory(messages, 5);

      expect(limited).toHaveLength(2);
      expect(limited).toEqual(messages);
    });

    it('should handle empty messages array', () => {
      const limited = limitConversationHistory([], 5);
      expect(limited).toEqual([]);
    });
  });
});