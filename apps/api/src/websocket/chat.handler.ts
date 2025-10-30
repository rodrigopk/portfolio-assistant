import { IncomingMessage } from 'http';

import { WebSocket, WebSocketServer } from 'ws';

import {
  AuthMessage,
  ChatMessage,
  ClientMessageSchema,
  ErrorMessage,
  ServerMessage,
  TypingMessage,
} from '../types/websocket.types';
import { logger } from '../utils/logger';

import { SessionManager } from './session.manager';

export class ChatWebSocketHandler {
  private wss: WebSocketServer;
  private sessionManager: SessionManager;

  constructor(wss: WebSocketServer) {
    this.wss = wss;
    this.sessionManager = new SessionManager();
    this.setupWebSocketServer();
  }

  /**
   * Setup WebSocket server with connection handling
   */
  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
      logger.info(`New WebSocket connection from ${request.socket.remoteAddress}`);

      // Store sessionId on the WebSocket object for later reference
      let sessionId: string | null = null;

      // Handle incoming messages
      ws.on('message', async (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString()) as unknown;

          // Validate message structure
          const validationResult = ClientMessageSchema.safeParse(message);
          if (!validationResult.success) {
            this.sendError(ws, 'Invalid message format', 'INVALID_MESSAGE');
            logger.warn('Invalid message received:', validationResult.error);
            return;
          }

          const clientMessage = validationResult.data;

          // Handle different message types
          switch (clientMessage.type) {
            case 'auth':
              await this.handleAuth(ws, clientMessage, (sid) => {
                sessionId = sid;
              });
              break;

            case 'chat':
              if (!sessionId) {
                this.sendError(ws, 'Not authenticated', 'NOT_AUTHENTICATED');
                return;
              }
              await this.handleChat(ws, clientMessage, sessionId);
              break;

            case 'typing':
              if (!sessionId) {
                this.sendError(ws, 'Not authenticated', 'NOT_AUTHENTICATED');
                return;
              }
              this.handleTyping(ws, clientMessage, sessionId);
              break;

            case 'ping':
              this.handlePing(ws);
              break;

            default:
              this.sendError(ws, 'Unknown message type', 'UNKNOWN_MESSAGE_TYPE');
          }
        } catch (error) {
          logger.error('Error processing message:', error);
          this.sendError(ws, 'Failed to process message', 'PROCESSING_ERROR');
        }
      });

      // Handle WebSocket errors
      ws.on('error', (error: Error) => {
        logger.error('WebSocket error:', error);
      });

      // Handle connection close
      ws.on('close', async (code: number, reason: Buffer) => {
        logger.info(`WebSocket connection closed: ${code} - ${reason.toString()}`);
        if (sessionId) {
          await this.sessionManager.unregisterSession(sessionId);
        }
      });

      // Send initial connection message
      this.sendMessage(ws, {
        type: 'pong',
      });
    });

    this.wss.on('error', (error: Error) => {
      logger.error('WebSocket server error:', error);
    });

    logger.info('WebSocket server initialized');
  }

  /**
   * Handle authentication messages
   */
  private async handleAuth(
    ws: WebSocket,
    message: AuthMessage,
    setSessionId: (sessionId: string) => void
  ): Promise<void> {
    try {
      const { sessionId } = message;

      // Register the session
      await this.sessionManager.registerSession(sessionId, ws);
      setSessionId(sessionId);

      // Send success message
      this.sendMessage(ws, {
        type: 'auth_success',
        sessionId,
      });

      logger.info(`Client authenticated with session: ${sessionId}`);
    } catch (error) {
      logger.error('Authentication error:', error);
      this.sendError(ws, 'Authentication failed', 'AUTH_FAILED');
    }
  }

  /**
   * Handle chat messages
   */
  private async handleChat(
    ws: WebSocket,
    message: ChatMessage,
    sessionId: string
  ): Promise<void> {
    try {
      // Check rate limit
      const canSend = await this.sessionManager.canSendMessage(sessionId);
      if (!canSend) {
        const resetTime = await this.sessionManager.getResetTime(sessionId);
        const resetMinutes = Math.ceil(resetTime / 60000);
        this.sendError(
          ws,
          `Rate limit exceeded. Please try again in ${resetMinutes} minute(s).`,
          'RATE_LIMIT_EXCEEDED'
        );
        return;
      }

      // Increment message count
      await this.sessionManager.incrementMessageCount(sessionId);

      // Log the message
      logger.info(`Chat message from ${sessionId}: ${message.message.substring(0, 50)}...`);

      // Generate mock response (AI agent will be integrated later)
      await this.generateMockResponse(ws, message.message, sessionId);
    } catch (error) {
      logger.error('Error handling chat message:', error);
      this.sendError(ws, 'Failed to process chat message', 'CHAT_ERROR');
    }
  }

  /**
   * Handle typing indicator messages
   */
  private handleTyping(
    _ws: WebSocket,
    message: TypingMessage,
    sessionId: string
  ): void {
    logger.debug(`Typing indicator from ${sessionId}: ${message.isTyping}`);
    // In a real implementation, this would broadcast to other clients
    // For now, we just log it
  }

  /**
   * Handle ping messages
   */
  private handlePing(ws: WebSocket): void {
    this.sendMessage(ws, {
      type: 'pong',
    });
  }

  /**
   * Generate mock response for chat messages
   * This will be replaced with actual AI agent integration later
   */
  private async generateMockResponse(
    ws: WebSocket,
    _message: string,
    sessionId: string
  ): Promise<void> {
    // Simulate AI thinking time
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Generate mock response based on the message
    const mockResponses = [
      'I understand you need help with your portfolio project. Let me assist you with that.',
      'That\'s an interesting question. Based on my analysis, I\'d recommend the following approach...',
      'I can help you implement that feature. Here\'s what I suggest...',
      'Great question! Let me break this down for you step by step.',
      'I\'ve analyzed your request and here\'s my recommendation...',
    ];

    const randomIndex = Math.floor(Math.random() * mockResponses.length);
    const selectedResponse = mockResponses[randomIndex] ?? mockResponses[0] ?? '';
    const words = selectedResponse.split(' ');

    // Send response token by token to simulate streaming
    for (const word of words) {
      if (ws.readyState !== WebSocket.OPEN) {
        logger.warn(`WebSocket closed for session ${sessionId}, stopping response`);
        return;
      }

      this.sendMessage(ws, {
        type: 'token',
        content: word + ' ',
      });

      // Simulate typing delay
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    // Send done message with a mock conversation ID
    const conversationId = `conv-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    this.sendMessage(ws, {
      type: 'done',
      conversationId,
    });

    logger.info(`Completed mock response for session ${sessionId}`);
  }

  /**
   * Send a message to the client
   */
  private sendMessage(ws: WebSocket, message: ServerMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Send an error message to the client
   */
  private sendError(ws: WebSocket, message: string, code?: string): void {
    const errorMessage: ErrorMessage = {
      type: 'error',
      message,
      code,
    };
    this.sendMessage(ws, errorMessage);
  }

  /**
   * Get the session manager
   */
  getSessionManager(): SessionManager {
    return this.sessionManager;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    logger.info('Cleaning up WebSocket handler...');
    await this.sessionManager.cleanup();

    // Close all connections
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.close(1000, 'Server shutting down');
      }
    });

    logger.info('WebSocket handler cleaned up');
  }
}
