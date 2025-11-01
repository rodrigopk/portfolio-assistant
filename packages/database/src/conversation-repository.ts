import type { PrismaClient, Conversation, Prisma } from './index.js';
import { getPrismaClient } from './index.js';

export interface MessageData {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp?: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Repository class for managing conversations in the database
 */
export class ConversationRepository {
  private prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || getPrismaClient();
  }

  /**
   * Find conversation by session ID
   */
  async findBySessionId(sessionId: string): Promise<Conversation | null> {
    return this.prisma.conversation.findUnique({
      where: { sessionId },
    });
  }

  /**
   * Create a new conversation
   */
  async createConversation(data: {
    sessionId: string;
    messages?: MessageData[];
    metadata?: Record<string, unknown>;
  }): Promise<Conversation> {
    return this.prisma.conversation.create({
      data: {
        sessionId: data.sessionId,
        messages: (data.messages || []) as unknown as Prisma.InputJsonValue[],
        metadata: (data.metadata || {}) as Prisma.InputJsonValue,
      },
    });
  }

  /**
   * Update conversation messages
   */
  async updateMessages(sessionId: string, messages: MessageData[]): Promise<Conversation> {
    return this.prisma.conversation.update({
      where: { sessionId },
      data: {
        messages: messages as unknown as Prisma.InputJsonValue[],
        lastActivity: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Add a single message to an existing conversation
   */
  async addMessage(sessionId: string, message: MessageData): Promise<Conversation> {
    const conversation = await this.findBySessionId(sessionId);
    if (!conversation) {
      // Create new conversation if it doesn't exist
      return this.createConversation({
        sessionId,
        messages: [message],
      });
    }

    const currentMessages = Array.isArray(conversation.messages)
      ? (conversation.messages as unknown as MessageData[])
      : [];

    const updatedMessages = [...currentMessages, message];

    return this.updateMessages(sessionId, updatedMessages);
  }

  /**
   * Get messages for a conversation with optional limit
   */
  async getMessages(sessionId: string, limit?: number): Promise<MessageData[]> {
    const conversation = await this.findBySessionId(sessionId);
    if (!conversation) {
      return [];
    }

    const messages = Array.isArray(conversation.messages)
      ? (conversation.messages as unknown as MessageData[])
      : [];

    return limit ? messages.slice(-limit) : messages;
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(sessionId: string): Promise<void> {
    await this.prisma.conversation.delete({
      where: { sessionId },
    });
  }

  /**
   * Get conversation metadata
   */
  async getMetadata(sessionId: string): Promise<Record<string, unknown> | null> {
    const conversation = await this.findBySessionId(sessionId);
    if (!conversation) {
      return null;
    }

    return (conversation.metadata as Record<string, unknown>) || {};
  }

  /**
   * Update conversation metadata
   */
  async updateMetadata(
    sessionId: string,
    metadata: Record<string, unknown>
  ): Promise<Conversation> {
    return this.prisma.conversation.update({
      where: { sessionId },
      data: {
        metadata: metadata as Prisma.InputJsonValue,
        lastActivity: new Date(),
        updatedAt: new Date(),
      },
    });
  }
}
