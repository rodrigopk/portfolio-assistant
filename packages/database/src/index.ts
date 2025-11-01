/**
 * Shared database package for Portfolio Assistant
 * Provides Prisma client, connection pooling, and database utilities
 */

// Export Prisma client and types
export { PrismaClient } from './generated/client/index.js';
export type { Profile, Project, Conversation, Prisma } from './generated/client/index.js';

// Export repository classes and types
export { ConversationRepository } from './conversation-repository.js';
export type { MessageData } from './conversation-repository.js';

// Export database connection and pooling
export { database, createDatabaseConnection, type ConnectionPoolConfig } from './connection.js';

// Export monitoring utilities
export {
  DatabaseMonitor,
  databaseMonitor,
  createHealthCheckMiddleware,
  getPerformanceRecommendations,
  type DatabaseMetrics,
} from './monitoring.js';

// Export configuration utilities
export {
  loadDatabaseConfig,
  getPrismaConfig,
  getRedisConfig,
  validateDatabaseConfig,
  databaseConfig,
  type DatabaseConfig,
} from './config.js';

// Legacy exports for backward compatibility
import { database } from './connection.js';
import { PrismaClient } from './generated/client/index.js';

/**
 * Get the singleton PrismaClient instance (legacy)
 * @deprecated Use database.getClient() instead
 */
export function getPrismaClient(): PrismaClient {
  return database.getClient();
}

/**
 * Disconnect the PrismaClient instance (legacy)
 * @deprecated Use database.disconnect() instead
 */
export async function disconnectPrisma(): Promise<void> {
  await database.disconnect();
}

// Export the default configured database instance
export default database;
