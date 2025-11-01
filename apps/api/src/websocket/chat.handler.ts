import { IncomingMessage } from 'http';

import { WebSocket, WebSocketServer } from 'ws';
import { ChatAgent } from '@portfolio/agents';

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
  private chatAgent: ChatAgent;

  constructor(wss: WebSocketServer) {
    this.wss = wss;
    this.sessionManager = new SessionManager();
    this.chatAgent = new ChatAgent();
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
          // Parse JSON - catch JSON parse errors separately
          let message: unknown;
          try {
            message = JSON.parse(data.toString()) as unknown;
          } catch (parseError) {
            this.sendError(ws, 'Invalid message format', 'INVALID_MESSAGE');
            logger.warn('Invalid JSON received:', parseError);
            return;
          }

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
              // Don't await - process messages concurrently for better rate limit testing
              logger.debug(`Received chat message for session ${sessionId}`);
              void this.handleChat(ws, clientMessage, sessionId);
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
  private async handleChat(ws: WebSocket, message: ChatMessage, sessionId: string): Promise<void> {
    try {
      // Check rate limit and increment atomically to prevent race conditions
      const canSend = await this.sessionManager.checkAndIncrementMessage(sessionId);
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

      // Log the message
      logger.info(`Chat message from ${sessionId}: ${message.message.substring(0, 50)}...`);

      // Generate AI response with streaming
      // This can run asynchronously without blocking
      this.generateAIResponse(ws, message.message, sessionId).catch((error) => {
        logger.error('Error generating AI response:', error);
        this.sendError(ws, 'Failed to generate response', 'AI_ERROR');
      });
    } catch (error) {
      logger.error('Error handling chat message:', error);
      this.sendError(ws, 'Failed to process chat message', 'CHAT_ERROR');
    }
  }

  /**
   * Handle typing indicator messages
   */
  private handleTyping(_ws: WebSocket, message: TypingMessage, sessionId: string): void {
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
   * Generate AI response for chat messages using ChatAgent
   */
  private async generateAIResponse(
    ws: WebSocket,
    message: string,
    sessionId: string
  ): Promise<void> {
    try {
      // Use the ChatAgent's streaming method
      const stream = this.chatAgent.chatStream(message, sessionId);

      let hasContent = false;
      for await (const token of stream) {
        if (ws.readyState !== WebSocket.OPEN) {
          logger.warn(`WebSocket closed for session ${sessionId}, stopping response`);
          return;
        }

        hasContent = true;
        this.sendMessage(ws, {
          type: 'token',
          content: token,
        });
      }

      // Send done message
      if (hasContent) {
        this.sendMessage(ws, {
          type: 'done',
          conversationId: sessionId,
        });
        logger.info(`Completed AI response for session ${sessionId}`);
      }
    } catch (error) {
      logger.error(`Error in AI response generation for session ${sessionId}:`, error);

      // Fallback to a generic error response
      if (ws.readyState === WebSocket.OPEN) {
        this.sendMessage(ws, {
          type: 'token',
          content: "I'm sorry, I'm having trouble processing your request right now. Please try again, or contact Rodrigo directly.",
        });
        this.sendMessage(ws, {
          type: 'done',
          conversationId: sessionId,
        });
      }
    }
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
