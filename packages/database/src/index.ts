export { PrismaClient } from './generated/client/index.js';
export type {
  Profile,
  Project,
  Conversation,
  Prisma
} from './generated/client/index.js';

// Export repository classes and types
export { ConversationRepository } from './conversation-repository.js';
export type { MessageData } from './conversation-repository.js';

import { PrismaClient } from './generated/client/index.js';

// Singleton instance
let prisma: PrismaClient | undefined;

/**
 * Get the singleton PrismaClient instance
 */
export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env['NODE_ENV'] === 'development' ? ['query', 'error', 'warn'] : ['error'],
      errorFormat: 'pretty',
    });
  }
  return prisma;
}

/**
 * Disconnect the PrismaClient instance
 */
export async function disconnectPrisma(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = undefined;
  }
}