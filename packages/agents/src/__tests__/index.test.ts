import { describe, it, expect, vi } from 'vitest';

// Mock @portfolio/database to prevent DATABASE_URL issues
vi.mock('@portfolio/database', () => ({
  ConversationRepository: vi.fn(),
}));

// Mock @prisma/client to prevent DATABASE_URL issues
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    $disconnect: vi.fn(),
  })),
}));

/**
 * Tests for the main index.ts exports
 * This ensures all exported modules and functions are properly accessible
 */
describe('Agents Package Exports', () => {
  describe('Main exports', () => {
    it('should export ChatAgent class', async () => {
      const { ChatAgent } = await import('../index');
      expect(ChatAgent).toBeDefined();
      expect(typeof ChatAgent).toBe('function');
    });

    it('should export CHAT_SYSTEM_PROMPT', async () => {
      const { CHAT_SYSTEM_PROMPT } = await import('../index');
      expect(CHAT_SYSTEM_PROMPT).toBeDefined();
      expect(typeof CHAT_SYSTEM_PROMPT).toBe('string');
    });

    it('should export Prisma utility functions', async () => {
      const { getPrismaClient, disconnectPrisma } = await import('../index');
      expect(getPrismaClient).toBeDefined();
      expect(disconnectPrisma).toBeDefined();
      expect(typeof getPrismaClient).toBe('function');
      expect(typeof disconnectPrisma).toBe('function');
    });
  });

  describe('Error handler exports', () => {
    it('should export error handling functions', async () => {
      const { handleChatError, handleStreamError } = await import('../index');
      expect(handleChatError).toBeDefined();
      expect(handleStreamError).toBeDefined();
      expect(typeof handleChatError).toBe('function');
      expect(typeof handleStreamError).toBe('function');
    });
  });

  describe('Tool executor exports', () => {
    it('should export tool execution functions', async () => {
      const { executeTool, processToolCalls, AGENT_TOOLS } = await import('../index');
      expect(executeTool).toBeDefined();
      expect(processToolCalls).toBeDefined();
      expect(AGENT_TOOLS).toBeDefined();
      expect(typeof executeTool).toBe('function');
      expect(typeof processToolCalls).toBe('function');
      expect(Array.isArray(AGENT_TOOLS)).toBe(true);
    });
  });

  describe('Message formatter exports', () => {
    it('should export message formatting functions', async () => {
      const { formatMessagesForClaude, createMessage, limitConversationHistory } = await import(
        '../index'
      );

      expect(formatMessagesForClaude).toBeDefined();
      expect(createMessage).toBeDefined();
      expect(limitConversationHistory).toBeDefined();
      expect(typeof formatMessagesForClaude).toBe('function');
      expect(typeof createMessage).toBe('function');
      expect(typeof limitConversationHistory).toBe('function');
    });
  });

  describe('Conversation store exports', () => {
    it('should export conversation storage functions', async () => {
      const { loadConversationHistory, saveConversation } = await import('../index');
      expect(loadConversationHistory).toBeDefined();
      expect(saveConversation).toBeDefined();
      expect(typeof loadConversationHistory).toBe('function');
      expect(typeof saveConversation).toBe('function');
    });
  });

  describe('Tool exports', () => {
    it('should export all tool functions', async () => {
      const exports = await import('../index');

      // Check that tool functions are exported
      expect(exports.checkAvailability).toBeDefined();
      expect(exports.getProjectDetails).toBeDefined();
      expect(exports.searchProjects).toBeDefined();
      expect(exports.searchBlogPosts).toBeDefined();
      expect(exports.suggestProposal).toBeDefined();

      expect(typeof exports.checkAvailability).toBe('function');
      expect(typeof exports.getProjectDetails).toBe('function');
      expect(typeof exports.searchProjects).toBe('function');
      expect(typeof exports.searchBlogPosts).toBe('function');
      expect(typeof exports.suggestProposal).toBe('function');
    });
  });

  describe('Module structure', () => {
    it('should export expected number of exports', async () => {
      const exports = await import('../index');
      const exportKeys = Object.keys(exports);

      // Should have a reasonable number of exports (at least the core ones)
      expect(exportKeys.length).toBeGreaterThan(10);
    });

    it('should not export undefined values', async () => {
      const exports = await import('../index');
      const exportKeys = Object.keys(exports);

      for (const key of exportKeys) {
        expect(exports[key as keyof typeof exports]).toBeDefined();
      }
    });
  });
});
