import { randomUUID } from 'crypto';

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { WebSocket, WebSocketServer } from 'ws';

import { ServerMessage, ErrorMessage } from '../types/websocket.types';
import { ChatWebSocketHandler } from '../websocket/chat.handler';

// Mock Redis to avoid connection issues in tests
vi.mock('../lib/redis', () => {
  const mockRedisData = new Map<string, { value: string; expiry: number }>();

  return {
    redisClient: {
      isOpen: true,
      setEx: vi.fn(async (key: string, ttl: number, value: string) => {
        mockRedisData.set(key, { value, expiry: Date.now() + ttl * 1000 });
        return 'OK';
      }),
      get: vi.fn(async (key: string) => {
        const data = mockRedisData.get(key);
        if (!data) return null;
        if (Date.now() > data.expiry) {
          mockRedisData.delete(key);
          return null;
        }
        return data.value;
      }),
      del: vi.fn(async (key: string) => {
        mockRedisData.delete(key);
        return 1;
      }),
    },
    connectRedis: vi.fn(async () => {}),
    disconnectRedis: vi.fn(async () => {}),
    cache: {
      get: vi.fn(async () => null),
      set: vi.fn(async () => {}),
      del: vi.fn(async () => {}),
      delPattern: vi.fn(async () => {}),
      exists: vi.fn(async () => false),
    },
  };
});

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
    it('should accept WebSocket connections', async () => {
      await new Promise<void>((resolve, reject) => {
        const client = new WebSocket(wsUrl);
        const timeout = setTimeout(() => {
          client.close();
          reject(new Error('Test timeout'));
        }, 5000);

        client.on('open', () => {
          try {
            expect(client.readyState).toBe(WebSocket.OPEN);
            client.close();
          } catch (error) {
            clearTimeout(timeout);
            reject(error);
          }
        });

        client.on('close', () => {
          clearTimeout(timeout);
          resolve();
        });

        client.on('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
    });

    it('should send initial pong message on connection', async () => {
      await new Promise<void>((resolve, reject) => {
        const client = new WebSocket(wsUrl);
        const timeout = setTimeout(() => {
          client.close();
          reject(new Error('Test timeout'));
        }, 5000);
        let messageReceived = false;

        client.on('message', (data: Buffer) => {
          if (!messageReceived) {
            try {
              messageReceived = true;
              const message = JSON.parse(data.toString()) as ServerMessage;
              expect(message.type).toBe('pong');
              client.close();
            } catch (error) {
              clearTimeout(timeout);
              reject(error);
            }
          }
        });

        client.on('close', () => {
          clearTimeout(timeout);
          resolve();
        });

        client.on('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
    });
  });

  describe('Authentication', () => {
    it('should authenticate with valid session ID', async () => {
      await new Promise<void>((resolve, reject) => {
        const client = new WebSocket(wsUrl);
        const sessionId = randomUUID();
        const timeout = setTimeout(() => {
          client.close();
          reject(new Error('Test timeout'));
        }, 5000);
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
          try {
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
          } catch (error) {
            clearTimeout(timeout);
            reject(error);
          }
        });

        client.on('close', () => {
          clearTimeout(timeout);
          resolve();
        });

        client.on('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
    });

    it('should reject chat messages without authentication', async () => {
      await new Promise<void>((resolve, reject) => {
        const client = new WebSocket(wsUrl);
        const sessionId = randomUUID();
        const timeout = setTimeout(() => {
          client.close();
          reject(new Error('Test timeout'));
        }, 5000);
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
          try {
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
          } catch (error) {
            clearTimeout(timeout);
            reject(error);
          }
        });

        client.on('close', () => {
          clearTimeout(timeout);
          resolve();
        });

        client.on('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
    });
  });

  describe('Chat Messages', () => {
    it(
      'should handle chat messages and stream response',
      async () => {
        await new Promise<void>((resolve, reject) => {
          const client = new WebSocket(wsUrl);
          const sessionId = randomUUID();
          const timeout = setTimeout(() => {
            client.close();
            reject(new Error('Test timeout'));
          }, 10000);
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
          try {
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
          } catch (error) {
            clearTimeout(timeout);
            reject(error);
          }
        });

        client.on('close', () => {
          clearTimeout(timeout);
          resolve();
        });

        client.on('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
    },
      15000
    );
  });

  describe('Ping/Pong', () => {
    it('should respond to ping with pong', async () => {
      await new Promise<void>((resolve, reject) => {
        const client = new WebSocket(wsUrl);
        const timeout = setTimeout(() => {
          client.close();
          reject(new Error('Test timeout'));
        }, 5000);
        let initialPongReceived = false;

        client.on('open', () => {
          // Wait for initial pong
          setTimeout(() => {
            client.send(JSON.stringify({ type: 'ping' }));
          }, 100);
        });

        client.on('message', (data: Buffer) => {
          try {
            const message = JSON.parse(data.toString()) as ServerMessage;
            if (message.type === 'pong') {
              if (!initialPongReceived) {
                initialPongReceived = true;
              } else {
                // This is the response to our ping
                client.close();
              }
            }
          } catch (error) {
            clearTimeout(timeout);
            reject(error);
          }
        });

        client.on('close', () => {
          clearTimeout(timeout);
          resolve();
        });

        client.on('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
    });
  });

  describe('Rate Limiting', () => {
    it(
      'should enforce rate limiting (20 requests per 10 minutes)',
      async () => {
        await new Promise<void>((resolve, reject) => {
          const client = new WebSocket(wsUrl);
          const sessionId = randomUUID();
          const timeout = setTimeout(() => {
            client.close();
            reject(new Error('Test timeout: rate limit error not received'));
          }, 20000);
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
          try {
            const message = JSON.parse(data.toString()) as ServerMessage;

            if (message.type === 'auth_success') {
              authCompleted = true;
              // Send multiple chat messages with small delays to avoid mock Redis race conditions
              const sendMessages = async () => {
                for (let i = 0; i < 25; i++) {
                  client.send(
                    JSON.stringify({
                      type: 'chat',
                      message: `Message ${i}`,
                      sessionId,
                    })
                  );
                  messagesSent++;
                  // Small delay to allow Redis mock to process sequentially
                  await new Promise((r) => setTimeout(r, 10));
                }
              };
              void sendMessages();
            }

            if (authCompleted && message.type === 'error') {
              const errorMessage = message as ErrorMessage;
              if (errorMessage.code === 'RATE_LIMIT_EXCEEDED') {
                rateLimitError = true;
                expect(messagesSent).toBeGreaterThan(20);
                // Wait a bit before closing to ensure all messages are processed
                setTimeout(() => {
                  client.close();
                }, 100);
              }
            }
          } catch (error) {
            clearTimeout(timeout);
            reject(error);
          }
        });

        client.on('close', () => {
          clearTimeout(timeout);
          try {
            expect(rateLimitError).toBe(true);
            resolve();
          } catch (error) {
            reject(error);
          }
        });

        client.on('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
    },
      25000
    );
  });

  describe('Error Handling', () => {
    it('should reject invalid message format', async () => {
      await new Promise<void>((resolve, reject) => {
        const client = new WebSocket(wsUrl);
        const timeout = setTimeout(() => {
          client.close();
          reject(new Error('Test timeout'));
        }, 5000);
        let initialPongReceived = false;

        client.on('open', () => {
          // Wait for initial pong
          setTimeout(() => {
            client.send('invalid json');
          }, 100);
        });

        client.on('message', (data: Buffer) => {
          try {
            const message = JSON.parse(data.toString()) as ServerMessage;

            if (message.type === 'pong') {
              initialPongReceived = true;
              return;
            }

            if (initialPongReceived && message.type === 'error') {
              expect(message.code).toBe('INVALID_MESSAGE');
              client.close();
            }
          } catch (error) {
            clearTimeout(timeout);
            reject(error);
          }
        });

        client.on('close', () => {
          clearTimeout(timeout);
          resolve();
        });

        client.on('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
    });

    it('should reject messages with invalid schema', async () => {
      await new Promise<void>((resolve, reject) => {
        const client = new WebSocket(wsUrl);
        const timeout = setTimeout(() => {
          client.close();
          reject(new Error('Test timeout'));
        }, 5000);
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
          try {
            const message = JSON.parse(data.toString()) as ServerMessage;

            if (message.type === 'pong') {
              initialPongReceived = true;
              return;
            }

            if (initialPongReceived && message.type === 'error') {
              expect(message.code).toBe('INVALID_MESSAGE');
              client.close();
            }
          } catch (error) {
            clearTimeout(timeout);
            reject(error);
          }
        });

        client.on('close', () => {
          clearTimeout(timeout);
          resolve();
        });

        client.on('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
    });
  });

  describe('Session Management', () => {
    it('should handle multiple sessions independently', async () => {
      await new Promise<void>((resolve, reject) => {
        const client1 = new WebSocket(wsUrl);
        const client2 = new WebSocket(wsUrl);
        const sessionId1 = randomUUID();
        const sessionId2 = randomUUID();
        const timeout = setTimeout(() => {
          client1.close();
          client2.close();
          reject(new Error('Test timeout'));
        }, 5000);
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
          try {
            const message = JSON.parse(data.toString()) as ServerMessage;
            if (message.type === 'auth_success') {
              client1Authenticated = true;
              if (client2Authenticated) {
                client1.close();
                client2.close();
              }
            }
          } catch (error) {
            clearTimeout(timeout);
            reject(error);
          }
        });

        client2.on('message', (data: Buffer) => {
          try {
            const message = JSON.parse(data.toString()) as ServerMessage;
            if (message.type === 'auth_success') {
              client2Authenticated = true;
              if (client1Authenticated) {
                client1.close();
                client2.close();
              }
            }
          } catch (error) {
            clearTimeout(timeout);
            reject(error);
          }
        });

        let closedCount = 0;
        const onClose = () => {
          closedCount++;
          if (closedCount === 2) {
            clearTimeout(timeout);
            resolve();
          }
        };

        client1.on('close', onClose);
        client2.on('close', onClose);

        client1.on('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
        client2.on('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
    });

    it('should replace old connection when same session connects twice', async () => {
      await new Promise<void>((resolve, reject) => {
        const sessionId = randomUUID();
        const client1 = new WebSocket(wsUrl);
        const timeout = setTimeout(() => {
          client1.close();
          reject(new Error('Test timeout'));
        }, 5000);
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
          try {
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
                try {
                  const message = JSON.parse(data.toString()) as ServerMessage;
                  if (message.type === 'auth_success') {
                    // client1 should have been closed by now
                    setTimeout(() => {
                      try {
                        expect(client1Closed).toBe(true);
                        client2.close();
                      } catch (error) {
                        clearTimeout(timeout);
                        reject(error);
                      }
                    }, 100);
                  }
                } catch (error) {
                  clearTimeout(timeout);
                  reject(error);
                }
              });

              client2.on('close', () => {
                clearTimeout(timeout);
                resolve();
              });

              client2.on('error', (error) => {
                clearTimeout(timeout);
                reject(error);
              });
            }
          } catch (error) {
            clearTimeout(timeout);
            reject(error);
          }
        });

        client1.on('close', () => {
          client1Closed = true;
        });

        client1.on('error', (error) => {
          // Expected - connection will be closed, only fail on unexpected errors
          if (!client1Closed) {
            clearTimeout(timeout);
            reject(error);
          }
        });
      });
    });
  });
});
