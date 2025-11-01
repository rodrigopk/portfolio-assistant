import { motion } from 'framer-motion';
import type { Message } from '../../../types/chat';

interface MessageItemProps {
  message: Message;
}

export function MessageItem({ message }: MessageItemProps) {
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
