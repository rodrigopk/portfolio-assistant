export { ChatAgent } from './chat-agent';
export { CHAT_SYSTEM_PROMPT } from './prompts/system';
export type { Message, ConversationContext } from './chat-agent';

export * from './tools';
export { getPrismaClient, disconnectPrisma } from './lib/prisma';

// Export utility functions for easier testing and reuse
export { handleChatError, handleStreamError } from './utils/error-handler';
export { executeTool, processToolCalls, AGENT_TOOLS } from './utils/tool-executor';
export { formatMessagesForClaude, createMessage, limitConversationHistory } from './utils/message-formatter';
export { loadConversationHistory, saveConversation } from './utils/conversation-store';
