import { useState, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { useChat } from '../../../contexts/ChatContext';

export function MessageInput() {
  const { sendMessage, connectionStatus, isTyping } = useChat();
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isDisabled = connectionStatus !== 'connected' || isTyping;

  const handleSubmit = () => {
    if (!input.trim() || isDisabled) return;

    sendMessage(input);
    setInput('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);

    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  return (
    <div className="border-t border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-end space-x-2">
        <div className="relative flex-1">
          <label htmlFor="chat-input" className="sr-only">
            Type your message
          </label>
          <textarea
            ref={textareaRef}
            id="chat-input"
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={
              isDisabled
                ? connectionStatus === 'connected'
                  ? 'Waiting for response...'
                  : 'Connecting...'
                : 'Type a message...'
            }
            disabled={isDisabled}
            rows={1}
            className="w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-blue-400 dark:focus:ring-blue-400 dark:disabled:bg-gray-800"
            style={{ maxHeight: '120px', minHeight: '40px' }}
            aria-label="Message input"
            aria-describedby="input-hint"
          />
          <span id="input-hint" className="sr-only">
            Press Enter to send, Shift+Enter for new line
          </span>
        </div>

        <motion.button
          type="button"
          onClick={handleSubmit}
          disabled={isDisabled || !input.trim()}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-300 disabled:hover:bg-gray-300 dark:disabled:bg-gray-600"
          whileHover={{ scale: isDisabled ? 1 : 1.05 }}
          whileTap={{ scale: isDisabled ? 1 : 0.95 }}
          aria-label="Send message"
          aria-disabled={isDisabled || !input.trim()}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        </motion.button>
      </div>

      {/* Character count and hints */}
      <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>
          {connectionStatus === 'connected' ? (
            <span className="flex items-center">
              <span className="mr-1 h-2 w-2 rounded-full bg-green-500" aria-label="Connected" />
              Connected
            </span>
          ) : connectionStatus === 'connecting' ? (
            <span className="flex items-center">
              <span
                className="mr-1 h-2 w-2 animate-pulse rounded-full bg-yellow-500"
                aria-label="Connecting"
              />
              Connecting...
            </span>
          ) : (
            <span className="flex items-center">
              <span className="mr-1 h-2 w-2 rounded-full bg-red-500" aria-label="Disconnected" />
              Disconnected
            </span>
          )}
        </span>
        <span aria-live="polite">{input.length > 0 && `${input.length} / 10000`}</span>
      </div>
    </div>
  );
}
