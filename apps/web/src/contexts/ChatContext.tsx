import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import type { Message, ServerMessage, ConnectionStatus } from '../types/chat';

interface ChatContextValue {
  // UI State
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;

  // Messages
  messages: Message[];
  sendMessage: (content: string) => void;
  clearMessages: () => void;

  // Connection
  connectionStatus: ConnectionStatus;
  reconnect: () => void;

  // Session
  sessionId: string;

  // Error state
  error: string | null;
  clearError: () => void;

  // Typing indicator
  isTyping: boolean;
}

const ChatContext = createContext<ChatContextValue | null>(null);

function generateSessionId(): string {
  // Generate a UUID v4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface ChatProviderProps {
  children: React.ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId] = useState(() => {
    // Try to get from localStorage, or generate new
    const stored = localStorage.getItem('chat-session-id');
    if (stored) return stored;

    const newId = generateSessionId();
    localStorage.setItem('chat-session-id', newId);
    return newId;
  });
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const streamingMessageRef = React.useRef<string>('');

  // Get WebSocket URL from environment
  const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

  const handleMessage = useCallback((message: ServerMessage) => {
    switch (message.type) {
      case 'auth_success':
        setIsAuthenticated(true);
        setError(null);
        break;

      case 'token':
        setIsTyping(true);
        // Append token to streaming message
        streamingMessageRef.current += message.content;

        // Update the last message with streaming content
        setMessages((prev) => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage && lastMessage.role === 'assistant' && lastMessage.isStreaming) {
            return [
              ...prev.slice(0, -1),
              {
                ...lastMessage,
                content: streamingMessageRef.current,
              },
            ];
          }

          // Create new streaming message if none exists
          return [
            ...prev,
            {
              id: `msg-${Date.now()}`,
              content: streamingMessageRef.current,
              role: 'assistant',
              timestamp: new Date(),
              isStreaming: true,
            },
          ];
        });
        break;

      case 'done':
        setIsTyping(false);
        streamingMessageRef.current = '';

        // Mark streaming message as complete
        setMessages((prev) => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage && lastMessage.isStreaming) {
            return [
              ...prev.slice(0, -1),
              {
                ...lastMessage,
                isStreaming: false,
                conversationId: message.conversationId,
              },
            ];
          }
          return prev;
        });
        break;

      case 'error':
        setIsTyping(false);
        streamingMessageRef.current = '';
        setError(message.message);

        // Remove streaming message if error occurs
        setMessages((prev) => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage && lastMessage.isStreaming) {
            return prev.slice(0, -1);
          }
          return prev;
        });
        break;

      case 'pong':
        // Handle pong for keep-alive
        break;
    }
  }, []);

  const handleError = useCallback((error: Event) => {
    console.error('WebSocket error:', error);
    setError('Connection error. Attempting to reconnect...');
  }, []);

  const handleOpen = useCallback(() => {
    setError(null);

    // Send auth message on connection
    if (wsRef.current) {
      wsRef.current.sendMessage({
        type: 'auth',
        sessionId,
      });
    }
  }, [sessionId]);

  const handleClose = useCallback(() => {
    setIsAuthenticated(false);
  }, []);

  const wsRef = React.useRef<ReturnType<typeof useWebSocket> | null>(null);

  const ws = useWebSocket({
    url: wsUrl,
    onMessage: handleMessage,
    onError: handleError,
    onOpen: handleOpen,
    onClose: handleClose,
    reconnectInterval: 3000,
    maxReconnectAttempts: 5,
  });

  wsRef.current = ws;

  const sendMessage = useCallback(
    (content: string) => {
      if (!isAuthenticated) {
        setError('Not authenticated. Please wait for connection...');
        return;
      }

      if (!content.trim()) {
        return;
      }

      // Add user message to UI
      const userMessage: Message = {
        id: `msg-${Date.now()}-user`,
        content: content.trim(),
        role: 'user',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setError(null);

      // Send to server
      ws.sendMessage({
        type: 'chat',
        message: content.trim(),
        sessionId,
      });
    },
    [isAuthenticated, sessionId, ws.sendMessage]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    streamingMessageRef.current = '';
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reconnect = useCallback(() => {
    setError(null);
    ws.reconnect();
  }, [ws.reconnect]);

  // Ping interval to keep connection alive
  const { connectionStatus, sendMessage } = ws;
  useEffect(() => {
    if (connectionStatus === 'connected') {
      const interval = setInterval(() => {
        sendMessage({ type: 'ping' });
      }, 30000); // Ping every 30 seconds

      return () => clearInterval(interval);
    }
  }, [connectionStatus, sendMessage]);

  const value: ChatContextValue = {
    isOpen,
    setIsOpen,
    messages,
    sendMessage,
    clearMessages,
    connectionStatus: ws.connectionStatus,
    reconnect,
    sessionId,
    error,
    clearError,
    isTyping,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
