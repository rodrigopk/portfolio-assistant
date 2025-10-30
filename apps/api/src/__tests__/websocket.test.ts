import { randomUUID } from 'crypto';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { WebSocket, WebSocketServer } from 'ws';

import { ServerMessage, ErrorMessage } from '../types/websocket.types';
import { ChatWebSocketHandler } from '../websocket/chat.handler';

describe('WebSocket Chat Handler', () => {
  let wss: WebSocketServer;
  let handler: ChatWebSocketHandler;
  const port = 3002;
  const wsUrl = `ws://localhost:${port}/ws`;

  beforeAll(async () => {
    // Create a test WebSocket server
    wss = new WebSocketServer({ port, path: '/ws' });
    handler = new ChatWebSocketHandler(wss);

    // Wait a bit for the server to start
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  afterAll(async () => {
    // Cleanup
    await handler.cleanup();
    wss.close();
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  describe('Connection', () => {
    it('should accept WebSocket connections', (done) => {
      const client = new WebSocket(wsUrl);
      let finished = false;
      const finish = () => {
        if (!finished) {
          finished = true;
          done();
        }
      };

      client.on('open', () => {
        expect(client.readyState).toBe(WebSocket.OPEN);
        client.close();
      });

      client.on('close', finish);

      client.on('error', () => {
        // Ignore errors - connection may close during cleanup
      });
    });

    it('should send initial pong message on connection', (done) => {
      const client = new WebSocket(wsUrl);
      let finished = false;
      let messageReceived = false;

      client.on('message', (data: Buffer) => {
        if (!messageReceived) {
          messageReceived = true;
          const message = JSON.parse(data.toString()) as ServerMessage;
          expect(message.type).toBe('pong');
          client.close();
        }
      });

      client.on('close', () => {
        if (!finished) {
          finished = true;
          done();
        }
      });

      client.on('error', () => {
        // Ignore errors - connection may close during cleanup
      });
    });
  });

  describe('Authentication', () => {
    it('should authenticate with valid session ID', (done) => {
      const client = new WebSocket(wsUrl);
      const sessionId = randomUUID();
      let messageCount = 0;

      client.on('open', () => {
        client.send(
          JSON.stringify({
            type: 'auth',
            sessionId,
          })
        );
      });

      client.on('message', (data: Buffer) => {
        messageCount++;
        const message = JSON.parse(data.toString()) as ServerMessage;

        // First message is initial pong
        if (messageCount === 1) {
          expect(message.type).toBe('pong');
        }

        // Second message is auth success
        if (messageCount === 2) {
          expect(message.type).toBe('auth_success');
          if (message.type === 'auth_success') {
            expect(message.sessionId).toBe(sessionId);
          }
          client.close();
        }
      });

      client.on('close', () => {
        if (!finished) {
          finished = true;
          done();
        }
      });

      client.on('error', () => {
        // Ignore errors - connection may close during cleanup
      });
    });

    it('should reject chat messages without authentication', (done) => {
      const client = new WebSocket(wsUrl);
      const sessionId = randomUUID();
      let messageCount = 0;

      client.on('open', () => {
        // Try to send chat message without authenticating
        client.send(
          JSON.stringify({
            type: 'chat',
            message: 'Hello',
            sessionId,
          })
        );
      });

      client.on('message', (data: Buffer) => {
        messageCount++;
        const message = JSON.parse(data.toString()) as ServerMessage;

        // First message is initial pong
        if (messageCount === 1) {
          expect(message.type).toBe('pong');
        }

        // Second message should be an error
        if (messageCount === 2) {
          expect(message.type).toBe('error');
          if (message.type === 'error') {
            expect(message.code).toBe('NOT_AUTHENTICATED');
          }
          client.close();
        }
      });

      client.on('close', () => {
        if (!finished) {
          finished = true;
          done();
        }
      });

      client.on('error', () => {
        // Ignore errors - connection may close during cleanup
      });
    });
  });

  describe('Chat Messages', () => {
    it('should handle chat messages and stream response', (done) => {
      const client = new WebSocket(wsUrl);
      const sessionId = randomUUID();
      let authCompleted = false;
      let tokenCount = 0;

      client.on('open', () => {
        client.send(
          JSON.stringify({
            type: 'auth',
            sessionId,
          })
        );
      });

      client.on('message', (data: Buffer) => {
        const message = JSON.parse(data.toString()) as ServerMessage;

        // Wait for auth to complete
        if (message.type === 'auth_success') {
          authCompleted = true;
          // Send chat message
          client.send(
            JSON.stringify({
              type: 'chat',
              message: 'Hello, how can you help me?',
              sessionId,
            })
          );
          return;
        }

        if (authCompleted) {
          if (message.type === 'token') {
            tokenCount++;
            expect(message.content).toBeDefined();
          }

          if (message.type === 'done') {
            expect(message.conversationId).toBeDefined();
            expect(tokenCount).toBeGreaterThan(0);
            client.close();
          }
        }
      });

      client.on('close', () => {
        if (!finished) {
          finished = true;
          done();
        }
      });

      client.on('error', () => {
        // Ignore errors - connection may close during cleanup
      });
    }, 10000); // Increase timeout for this test
  });

  describe('Ping/Pong', () => {
    it('should respond to ping with pong', (done) => {
      const client = new WebSocket(wsUrl);
      let initialPongReceived = false;

      client.on('open', () => {
        // Wait for initial pong
        setTimeout(() => {
          client.send(JSON.stringify({ type: 'ping' }));
        }, 100);
      });

      client.on('message', (data: Buffer) => {
        const message = JSON.parse(data.toString()) as ServerMessage;
        if (message.type === 'pong') {
          if (!initialPongReceived) {
            initialPongReceived = true;
          } else {
            // This is the response to our ping
            client.close();
          }
        }
      });

      client.on('close', () => {
        if (!finished) {
          finished = true;
          done();
        }
      });

      client.on('error', () => {
        // Ignore errors - connection may close during cleanup
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limiting (20 requests per 10 minutes)', (done) => {
      const client = new WebSocket(wsUrl);
      const sessionId = randomUUID();
      let authCompleted = false;
      let messagesSent = 0;
      let rateLimitError = false;

      client.on('open', () => {
        client.send(
          JSON.stringify({
            type: 'auth',
            sessionId,
          })
        );
      });

      client.on('message', (data: Buffer) => {
        const message = JSON.parse(data.toString()) as ServerMessage;

        if (message.type === 'auth_success') {
          authCompleted = true;
          // Send multiple chat messages rapidly
          for (let i = 0; i < 25; i++) {
            client.send(
              JSON.stringify({
                type: 'chat',
                message: `Message ${i}`,
                sessionId,
              })
            );
            messagesSent++;
          }
        }

        if (authCompleted && message.type === 'error') {
          const errorMessage = message as ErrorMessage;
          if (errorMessage.code === 'RATE_LIMIT_EXCEEDED') {
            rateLimitError = true;
            expect(messagesSent).toBeGreaterThan(20);
            client.close();
          }
        }
      });

      client.on('close', () => {
        expect(rateLimitError).toBe(true);
        done();
      });

      client.on('error', () => {
        // Ignore errors - connection may close during cleanup
      });
    }, 20000); // Increase timeout for this test
  });

  describe('Error Handling', () => {
    it('should reject invalid message format', (done) => {
      const client = new WebSocket(wsUrl);
      let initialPongReceived = false;

      client.on('open', () => {
        // Wait for initial pong
        setTimeout(() => {
          client.send('invalid json');
        }, 100);
      });

      client.on('message', (data: Buffer) => {
        const message = JSON.parse(data.toString()) as ServerMessage;

        if (message.type === 'pong') {
          initialPongReceived = true;
          return;
        }

        if (initialPongReceived && message.type === 'error') {
          expect(message.code).toBe('INVALID_MESSAGE');
          client.close();
        }
      });

      client.on('close', () => {
        if (!finished) {
          finished = true;
          done();
        }
      });

      client.on('error', () => {
        // Ignore errors - connection may close during cleanup
      });
    });

    it('should reject messages with invalid schema', (done) => {
      const client = new WebSocket(wsUrl);
      let initialPongReceived = false;

      client.on('open', () => {
        // Wait for initial pong
        setTimeout(() => {
          client.send(
            JSON.stringify({
              type: 'chat',
              // Missing required fields
            })
          );
        }, 100);
      });

      client.on('message', (data: Buffer) => {
        const message = JSON.parse(data.toString()) as ServerMessage;

        if (message.type === 'pong') {
          initialPongReceived = true;
          return;
        }

        if (initialPongReceived && message.type === 'error') {
          expect(message.code).toBe('INVALID_MESSAGE');
          client.close();
        }
      });

      client.on('close', () => {
        if (!finished) {
          finished = true;
          done();
        }
      });

      client.on('error', () => {
        // Ignore errors - connection may close during cleanup
      });
    });
  });

  describe('Session Management', () => {
    it('should handle multiple sessions independently', (done) => {
      const client1 = new WebSocket(wsUrl);
      const client2 = new WebSocket(wsUrl);
      const sessionId1 = randomUUID();
      const sessionId2 = randomUUID();
      let client1Authenticated = false;
      let client2Authenticated = false;

      client1.on('open', () => {
        client1.send(
          JSON.stringify({
            type: 'auth',
            sessionId: sessionId1,
          })
        );
      });

      client2.on('open', () => {
        client2.send(
          JSON.stringify({
            type: 'auth',
            sessionId: sessionId2,
          })
        );
      });

      client1.on('message', (data: Buffer) => {
        const message = JSON.parse(data.toString()) as ServerMessage;
        if (message.type === 'auth_success') {
          client1Authenticated = true;
          if (client2Authenticated) {
            client1.close();
            client2.close();
          }
        }
      });

      client2.on('message', (data: Buffer) => {
        const message = JSON.parse(data.toString()) as ServerMessage;
        if (message.type === 'auth_success') {
          client2Authenticated = true;
          if (client1Authenticated) {
            client1.close();
            client2.close();
          }
        }
      });

      let closedCount = 0;
      const onClose = () => {
        closedCount++;
        if (closedCount === 2) {
          done();
        }
      };

      client1.on('close', onClose);
      client2.on('close', onClose);

      client1.on('error', () => {
        // Ignore errors - connection may close during cleanup
      });
      client2.on('error', () => {
        // Ignore errors - connection may close during cleanup
      });
    });

    it('should replace old connection when same session connects twice', (done) => {
      const sessionId = randomUUID();
      const client1 = new WebSocket(wsUrl);
      let client1Closed = false;

      client1.on('open', () => {
        client1.send(
          JSON.stringify({
            type: 'auth',
            sessionId,
          })
        );
      });

      client1.on('message', (data: Buffer) => {
        const message = JSON.parse(data.toString()) as ServerMessage;
        if (message.type === 'auth_success') {

          // Create second connection with same session ID
          const client2 = new WebSocket(wsUrl);

          client2.on('open', () => {
            client2.send(
              JSON.stringify({
                type: 'auth',
                sessionId, // Same session ID
              })
            );
          });

          client2.on('message', (data: Buffer) => {
            const message = JSON.parse(data.toString()) as ServerMessage;
            if (message.type === 'auth_success') {
              // client1 should have been closed by now
              setTimeout(() => {
                expect(client1Closed).toBe(true);
                client2.close();
              }, 100);
            }
          });

          client2.on('close', () => {
            done();
          });

          client2.on('error', (error) => {
            done(error);
          });
        }
      });

      client1.on('close', () => {
        client1Closed = true;
      });

      client1.on('error', (_error) => {
        // Expected - connection will be closed
      });
    });
  });
});
