import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '../../../hooks/useChat';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { SuggestedQuestions } from './SuggestedQuestions';
import { ChatIcon, RefreshIcon, TrashIcon, CloseIcon, AlertIcon } from '../../icons';

export function ChatWindow() {
  const { isOpen, setIsOpen, error, clearError, connectionStatus, reconnect, clearMessages } =
    useChat();
  const windowRef = useRef<HTMLDivElement>(null);

  // Focus trap - focus first interactive element when opened
  useEffect(() => {
    if (isOpen && windowRef.current) {
      const firstInput = windowRef.current.querySelector<HTMLElement>('textarea, button');
      firstInput?.focus();
    }
  }, [isOpen]);

  // Handle escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, setIsOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/20 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Chat Window */}
          <motion.div
            ref={windowRef}
            role="dialog"
            aria-label="Chat window"
            aria-modal="true"
            className="fixed right-6 bottom-20 z-50 flex h-[600px] w-[400px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-lg bg-white shadow-2xl md:bottom-24 dark:bg-gray-800"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 25,
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 bg-blue-600 px-4 py-3 text-white dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500">
                  <ChatIcon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold">Chat Assistant</h2>
                  <p className="text-xs text-blue-100">
                    {connectionStatus === 'connected' && 'Online'}
                    {connectionStatus === 'connecting' && 'Connecting...'}
                    {connectionStatus === 'disconnected' && 'Disconnected'}
                    {connectionStatus === 'error' && 'Connection Error'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                {/* Reconnect button */}
                {(connectionStatus === 'disconnected' || connectionStatus === 'error') && (
                  <button
                    onClick={reconnect}
                    className="rounded p-1 hover:bg-blue-500 focus:ring-2 focus:ring-white focus:outline-none"
                    aria-label="Reconnect"
                    title="Reconnect"
                  >
                    <RefreshIcon />
                  </button>
                )}

                {/* Clear chat button */}
                <button
                  onClick={clearMessages}
                  className="rounded p-1 hover:bg-blue-500 focus:ring-2 focus:ring-white focus:outline-none"
                  aria-label="Clear chat"
                  title="Clear chat"
                >
                  <TrashIcon />
                </button>

                {/* Close button */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded p-1 hover:bg-blue-500 focus:ring-2 focus:ring-white focus:outline-none"
                  aria-label="Close chat"
                >
                  <CloseIcon />
                </button>
              </div>
            </div>

            {/* Error banner */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden bg-red-50 dark:bg-red-900/20"
                >
                  <div className="flex items-center justify-between px-4 py-2">
                    <div className="flex items-center space-x-2">
                      <AlertIcon className="text-red-600 dark:text-red-400" />
                      <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                    </div>
                    <button
                      onClick={clearError}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      aria-label="Dismiss error"
                    >
                      <CloseIcon />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Message List */}
            <MessageList />

            {/* Suggested Questions */}
            <SuggestedQuestions />

            {/* Message Input */}
            <MessageInput />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
