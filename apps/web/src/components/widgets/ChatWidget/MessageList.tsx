import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '../../../contexts/ChatContext';
import type { Message } from '../../../types/chat';

interface MessageItemProps {
  message: Message;
}

function MessageItem({ message }: MessageItemProps) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100'
        }`}
        role="article"
        aria-label={`${message.role === 'user' ? 'Your message' : 'Assistant message'}`}
      >
        <p className="text-sm break-words whitespace-pre-wrap">
          {message.content}
          {message.isStreaming && (
            <motion.span
              className="ml-1 inline-block h-3 w-1 bg-current"
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              aria-label="Typing indicator"
            />
          )}
        </p>
        <time
          className={`mt-1 block text-xs ${isUser ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}
          dateTime={message.timestamp.toISOString()}
        >
          {message.timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </time>
      </div>
    </motion.div>
  );
}

export function MessageList() {
  const { messages, isTyping } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  if (messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <h3 className="mt-4 text-sm font-medium text-gray-900 dark:text-gray-100">
            No messages yet
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Start a conversation by sending a message or selecting a suggested question below.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 space-y-4 overflow-y-auto p-4"
      role="log"
      aria-live="polite"
      aria-label="Chat messages"
    >
      <AnimatePresence mode="popLayout">
        {messages.map((message) => (
          <MessageItem key={message.id} message={message} />
        ))}
      </AnimatePresence>

      {/* Typing indicator */}
      {isTyping && messages[messages.length - 1]?.role === 'user' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="flex justify-start"
        >
          <div className="flex items-center space-x-2 rounded-lg bg-gray-100 px-4 py-2 dark:bg-gray-700">
            <motion.div
              className="h-2 w-2 rounded-full bg-gray-400"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0 }}
            />
            <motion.div
              className="h-2 w-2 rounded-full bg-gray-400"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
            />
            <motion.div
              className="h-2 w-2 rounded-full bg-gray-400"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
            />
          </div>
        </motion.div>
      )}

      <div ref={messagesEndRef} aria-hidden="true" />
    </div>
  );
}
