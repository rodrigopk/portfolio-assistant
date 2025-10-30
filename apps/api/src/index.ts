import { Server } from 'http';

import dotenv from 'dotenv';
import { WebSocketServer } from 'ws';

import app from './app';
import { connectRedis, disconnectRedis } from './lib/redis';
import { logger } from './utils/logger';
import { ChatWebSocketHandler } from './websocket/chat.handler';

// Load environment variables
dotenv.config();

const PORT = process.env['PORT'] || 3001;
const HOST = process.env['HOST'] || 'localhost';

let server: Server | null = null;
let chatHandler: ChatWebSocketHandler | null = null;

// Initialize connections and start server
async function startServer(): Promise<void> {
  try {
    // Connect to Redis
    await connectRedis();
    logger.info('Redis connected successfully');
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    logger.warn('Continuing without Redis - cache operations will be gracefully handled');
  }

  // Start HTTP server
  server = app.listen(PORT, () => {
    logger.info(`Server running in ${process.env['NODE_ENV'] || 'development'} mode`);
    logger.info(`Listening on http://${HOST}:${PORT}`);
  });

  // Setup WebSocket server
  const wss = new WebSocketServer({ server, path: '/ws' });
  chatHandler = new ChatWebSocketHandler(wss);
  logger.info('WebSocket server listening on ws://' + HOST + ':' + PORT + '/ws');
}

// Start the server
startServer().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});

// Graceful shutdown
const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`${signal} received, starting graceful shutdown...`);

  // Cleanup WebSocket handler
  if (chatHandler) {
    try {
      await chatHandler.cleanup();
      logger.info('WebSocket handler cleaned up');
    } catch (error) {
      logger.error('Error cleaning up WebSocket handler:', error);
    }
  }

  // Disconnect from Redis
  try {
    await disconnectRedis();
    logger.info('Redis disconnected');
  } catch (error) {
    logger.error('Error disconnecting Redis:', error);
  }

  if (server) {
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled rejections
process.on('unhandledRejection', (reason: Error) => {
  logger.error('Unhandled Rejection:', reason);
  throw reason;
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

export default server;
