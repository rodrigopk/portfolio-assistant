import { useEffect, useRef, useState, useCallback } from 'react';
import type { ServerMessage, ClientMessage, ConnectionStatus } from '../types/chat';

interface UseWebSocketOptions {
  url: string;
  onMessage: (message: ServerMessage) => void;
  onError?: (error: Event) => void;
  onOpen?: () => void;
  onClose?: () => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

interface UseWebSocketReturn {
  sendMessage: (message: ClientMessage) => void;
  connectionStatus: ConnectionStatus;
  reconnect: () => void;
  disconnect: () => void;
}

export function useWebSocket({
  url,
  onMessage,
  onError,
  onOpen,
  onClose,
  reconnectInterval = 3000,
  maxReconnectAttempts = 5,
}: UseWebSocketOptions): UseWebSocketReturn {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const shouldReconnectRef = useRef(true);
  const messageQueueRef = useRef<ClientMessage[]>([]);

  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      setConnectionStatus('connecting');
      const ws = new WebSocket(url);

      ws.onopen = () => {
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
        clearReconnectTimeout();

        // Send queued messages
        while (messageQueueRef.current.length > 0) {
          const message = messageQueueRef.current.shift();
          if (message) {
            ws.send(JSON.stringify(message));
          }
        }

        onOpen?.();
      };

      ws.onmessage = (event) => {
        try {
          const message: ServerMessage = JSON.parse(event.data);
          onMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        setConnectionStatus('error');
        onError?.(error);
      };

      ws.onclose = () => {
        setConnectionStatus('disconnected');
        wsRef.current = null;
        onClose?.();

        // Attempt reconnection if enabled and under max attempts
        if (shouldReconnectRef.current && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          const delay = reconnectInterval * Math.pow(2, reconnectAttemptsRef.current - 1);

          clearReconnectTimeout();
          reconnectTimeoutRef.current = setTimeout(
            () => {
              connect();
            },
            Math.min(delay, 30000)
          ); // Cap at 30 seconds
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionStatus('error');
    }
  }, [
    url,
    onMessage,
    onError,
    onOpen,
    onClose,
    reconnectInterval,
    maxReconnectAttempts,
    clearReconnectTimeout,
  ]);

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    clearReconnectTimeout();

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setConnectionStatus('disconnected');
  }, [clearReconnectTimeout]);

  const reconnect = useCallback(() => {
    disconnect();
    shouldReconnectRef.current = true;
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect, disconnect]);

  const sendMessage = useCallback(
    (message: ClientMessage) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(message));
      } else {
        // Queue message if not connected
        messageQueueRef.current.push(message);

        // Attempt to reconnect if disconnected
        if (connectionStatus === 'disconnected') {
          reconnect();
        }
      }
    },
    [connectionStatus, reconnect]
  );

  // Connect on mount
  useEffect(() => {
    shouldReconnectRef.current = true;
    connect();

    return () => {
      shouldReconnectRef.current = false;
      clearReconnectTimeout();
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect, clearReconnectTimeout]);

  return {
    sendMessage,
    connectionStatus,
    reconnect,
    disconnect,
  };
}
