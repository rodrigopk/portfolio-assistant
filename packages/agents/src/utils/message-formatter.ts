import type { Message } from '../chat-agent';

/**
 * Convert internal message format to Claude API format
 */
export function formatMessagesForClaude(messages: Message[]): Array<{ role: 'user' | 'assistant'; content: string }> {
  return messages.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));
}

/**
 * Create a new message object with timestamp
 */
export function createMessage(role: 'user' | 'assistant', content: string, timestamp?: Date): Message {
  return {
    role,
    content,
    timestamp: timestamp || new Date(),
  };
}

/**
 * Limit conversation history to the specified number of messages
 */
export function limitConversationHistory(messages: Message[], maxMessages: number): Message[] {
  return messages.slice(-maxMessages);
}