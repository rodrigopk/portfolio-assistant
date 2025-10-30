import { z } from 'zod';

// Client -> Server Message Types
export const ChatMessageSchema = z.object({
  type: z.literal('chat'),
  message: z.string().min(1).max(10000),
  sessionId: z.string().uuid(),
});

export const TypingMessageSchema = z.object({
  type: z.literal('typing'),
  isTyping: z.boolean(),
});

export const PingMessageSchema = z.object({
  type: z.literal('ping'),
});

export const AuthMessageSchema = z.object({
  type: z.literal('auth'),
  sessionId: z.string().uuid(),
});

export const ClientMessageSchema = z.discriminatedUnion('type', [
  ChatMessageSchema,
  TypingMessageSchema,
  PingMessageSchema,
  AuthMessageSchema,
]);

export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type TypingMessage = z.infer<typeof TypingMessageSchema>;
export type PingMessage = z.infer<typeof PingMessageSchema>;
export type AuthMessage = z.infer<typeof AuthMessageSchema>;
export type ClientMessage = z.infer<typeof ClientMessageSchema>;

// Server -> Client Message Types
export interface TokenMessage {
  type: 'token';
  content: string;
}

export interface DoneMessage {
  type: 'done';
  conversationId: string;
}

export interface ErrorMessage {
  type: 'error';
  message: string;
  code?: string;
}

export interface PongMessage {
  type: 'pong';
}

export interface AuthSuccessMessage {
  type: 'auth_success';
  sessionId: string;
}

export type ServerMessage =
  | TokenMessage
  | DoneMessage
  | ErrorMessage
  | PongMessage
  | AuthSuccessMessage;

// Session data
export interface SessionData {
  sessionId: string;
  authenticated: boolean;
  messageCount: number;
  firstMessageAt: number;
  lastMessageAt: number;
}

// Rate limit configuration
export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 20,
  windowMs: 10 * 60 * 1000, // 10 minutes
};
