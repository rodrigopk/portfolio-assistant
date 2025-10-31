import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '../../../contexts/ChatContext';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { SuggestedQuestions } from './SuggestedQuestions';

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
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                      clipRule="evenodd"
                    />
                  </svg>
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
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                )}

                {/* Clear chat button */}
                <button
                  onClick={clearMessages}
                  className="rounded p-1 hover:bg-blue-500 focus:ring-2 focus:ring-white focus:outline-none"
                  aria-label="Clear chat"
                  title="Clear chat"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                {/* Close button */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded p-1 hover:bg-blue-500 focus:ring-2 focus:ring-white focus:outline-none"
                  aria-label="Close chat"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
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
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-red-600 dark:text-red-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                    </div>
                    <button
                      onClick={clearError}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      aria-label="Dismiss error"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
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
