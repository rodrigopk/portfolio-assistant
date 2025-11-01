import { ConversationRepository, type MessageData } from '@portfolio/database';
import type { Message } from '../chat-agent';
import { logger } from '../lib/logger';

/**
 * Load conversation history from database
 */
export async function loadConversationHistory(
  _prisma: unknown, // Legacy parameter for compatibility
  sessionId: string,
  maxMessages: number
): Promise<Message[]> {
  try {
    const repository = new ConversationRepository();
    const messages = await repository.getMessages(sessionId, maxMessages);

    // Convert MessageData to Message format (filter out system/tool messages)
    return messages
      .filter((msg: MessageData) => msg.role === 'user' || msg.role === 'assistant')
      .map((msg: MessageData) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: msg.timestamp,
      }));
  } catch (error) {
    logger.error('Error loading conversation history:', error);
    return [];
  }
}

/**
 * Save conversation to database
 */
export async function saveConversation(
  _prisma: unknown, // Legacy parameter for compatibility
  sessionId: string,
  messages: Message[],
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const repository = new ConversationRepository();

    // Convert Messages to MessageData and save each one
    for (const message of messages) {
      const messageData: MessageData = {
        role: message.role,
        content: message.content,
        timestamp: new Date(),
      };
      await repository.addMessage(sessionId, messageData);
    }

    logger.info('Saved conversation for session:', {
      sessionId,
      messageCount: messages.length,
      metadata,
    });
  } catch (error) {
    logger.error('Error saving conversation:', error);
    throw error;
  }
}
