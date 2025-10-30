import { logger } from '../utils/logger';

// Import PrismaClient dynamically to avoid build errors when Prisma client is not generated
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaClientType = any;

// PrismaClient is attached to the `global` object in development to prevent
// exhausting database connection limit during development with hot reloading
const globalForPrisma = global as unknown as { prisma: PrismaClientType };

let prismaInstance: PrismaClientType;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { PrismaClient } = require('@prisma/client');
  prismaInstance =
    globalForPrisma.prisma ||
    new PrismaClient({
      log: process.env['NODE_ENV'] === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

  if (process.env['NODE_ENV'] !== 'production') {
    globalForPrisma.prisma = prismaInstance;
  }
} catch (error) {
  logger.warn('Prisma client not available. Database operations will not work.');
  prismaInstance = null;
}

export const prisma = prismaInstance;

// Graceful shutdown
process.on('beforeExit', async () => {
  if (prisma) {
    logger.info('Disconnecting from database...');
    await prisma.$disconnect();
  }
});

export default prisma;
