import { motion } from 'framer-motion';
import { useChat } from '../../../hooks/useChat';

const SUGGESTED_QUESTIONS = [
  'What projects have you worked on?',
  'What technologies do you specialize in?',
  'How can I get in touch with you?',
  'Tell me about your experience',
];

export function SuggestedQuestions() {
  const { sendMessage, messages, connectionStatus } = useChat();

  // Only show if no messages yet
  if (messages.length > 0) {
    return null;
  }

  const handleQuestionClick = (question: string) => {
    sendMessage(question);
  };

  return (
    <div className="border-t border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
      <h3 className="mb-3 text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
        Suggested Questions
      </h3>
      <div className="grid gap-2">
        {SUGGESTED_QUESTIONS.map((question, index) => (
          <motion.button
            key={question}
            onClick={() => handleQuestionClick(question)}
            disabled={connectionStatus !== 'connected'}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-left text-sm text-gray-700 transition-colors hover:border-blue-500 hover:bg-blue-50 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-blue-400 dark:hover:bg-gray-700"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: connectionStatus === 'connected' ? 1.02 : 1 }}
            whileTap={{ scale: connectionStatus === 'connected' ? 0.98 : 1 }}
            aria-label={`Ask: ${question}`}
          >
            {question}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
