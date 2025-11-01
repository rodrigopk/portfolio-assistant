import { getPrismaClient, disconnectPrisma } from '@portfolio/database';

import { logger } from '../utils/logger';

// Get the shared database client
export const prisma = getPrismaClient();

// Graceful shutdown
process.on('beforeExit', async () => {
  try {
    logger.info('Disconnecting from database...');
    await disconnectPrisma();
  } catch (error) {
    logger.error('Error disconnecting from database:', error);
  }
});

export default prisma;
