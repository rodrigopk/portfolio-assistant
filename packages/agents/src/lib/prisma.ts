import { PrismaClient } from '@prisma/client';

/**
 * PrismaClient singleton to prevent multiple instances in serverless environments
 * and ensure connection pooling works correctly.
 */
class PrismaClientSingleton {
  private static instance: PrismaClient | null = null;

  private constructor() {
    // Private constructor to prevent direct instantiation
  }

  /**
   * Get the singleton PrismaClient instance
   */
  public static getInstance(): PrismaClient {
    if (!PrismaClientSingleton.instance) {
      PrismaClientSingleton.instance = new PrismaClient({
        log: process.env['NODE_ENV'] === 'development' ? ['error', 'warn'] : ['error'],
      });
    }
    return PrismaClientSingleton.instance;
  }

  /**
   * Disconnect the PrismaClient instance
   * Useful for cleanup in tests or graceful shutdown
   */
  public static async disconnect(): Promise<void> {
    if (PrismaClientSingleton.instance) {
      await PrismaClientSingleton.instance.$disconnect();
      PrismaClientSingleton.instance = null;
    }
  }
}

/**
 * Export the singleton instance getter
 */
export const getPrismaClient = (): PrismaClient => {
  return PrismaClientSingleton.getInstance();
};

/**
 * Export disconnect method for cleanup
 */
export const disconnectPrisma = async (): Promise<void> => {
  await PrismaClientSingleton.disconnect();
};
