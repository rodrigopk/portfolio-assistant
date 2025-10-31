// Message types matching backend WebSocket API

// Client -> Server Message Types
export interface ChatMessage {
  type: 'chat';
  message: string;
  sessionId: string;
}

export interface TypingMessage {
  type: 'typing';
  isTyping: boolean;
}

export interface PingMessage {
  type: 'ping';
}

export interface AuthMessage {
  type: 'auth';
  sessionId: string;
}

export type ClientMessage = ChatMessage | TypingMessage | PingMessage | AuthMessage;

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

// UI Message Types
export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isStreaming?: boolean;
  conversationId?: string;
}

// WebSocket Connection Status
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

// Rate Limit Error
export interface RateLimitError {
  code: 'RATE_LIMIT_EXCEEDED';
  message: string;
  retryAfter?: number;
}
