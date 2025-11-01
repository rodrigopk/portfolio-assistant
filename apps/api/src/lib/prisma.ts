import { database, databaseMonitor } from '@portfolio/database';

import { logger } from '../utils/logger';

// Initialize database connection
async function initializeDatabase() {
  try {
    await database.connect();
    logger.info('Database connection initialized with pooling');

    // Start monitoring in development/staging
    if (process.env['NODE_ENV'] !== 'production') {
      const monitor = databaseMonitor.startPeriodicMonitoring(60000); // 1 minute intervals

      // Stop monitoring on shutdown
      process.on('beforeExit', () => {
        clearInterval(monitor);
      });
    }
  } catch (error) {
    logger.error('Failed to initialize database connection:', error);
    throw error;
  }
}

// Initialize on module load
initializeDatabase().catch((error) => {
  logger.error('Database initialization failed:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('beforeExit', async () => {
  try {
    logger.info('Disconnecting from database...');
    await database.disconnect();
  } catch (error) {
    logger.error('Error disconnecting from database:', error);
  }
});

// Export a getter function that returns the client after connection
export function getPrisma() {
  return database.getClient();
}

// Export for backward compatibility
export const prisma = new Proxy({} as ReturnType<typeof database.getClient>, {
  get(_target, prop) {
    const client = database.getClient();
    return client[prop as keyof typeof client];
  },
});

export default prisma;
