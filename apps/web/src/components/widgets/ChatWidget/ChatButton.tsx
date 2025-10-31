import { motion } from 'framer-motion';
import { useChat } from '../../../contexts/ChatContext';

export function ChatButton() {
  const { isOpen, setIsOpen, messages, connectionStatus } = useChat();
  const unreadCount = messages.length > 0 && !isOpen ? 1 : 0;

  return (
    <motion.button
      onClick={() => setIsOpen(!isOpen)}
      className="fixed right-6 bottom-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 20,
      }}
      aria-label={isOpen ? 'Close chat' : 'Open chat'}
      aria-expanded={isOpen}
      aria-haspopup="dialog"
    >
      {/* Connection status indicator */}
      {connectionStatus !== 'connected' && !isOpen && (
        <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-yellow-400 ring-2 ring-white" />
      )}

      {/* Unread indicator */}
      {unreadCount > 0 && (
        <motion.span
          className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 15 }}
        >
          {unreadCount}
        </motion.span>
      )}

      {/* Icon */}
      <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        animate={{ rotate: isOpen ? 180 : 0 }}
        transition={{ duration: 0.3 }}
      >
        {isOpen ? (
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        ) : (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        )}
      </motion.svg>
    </motion.button>
  );
}
