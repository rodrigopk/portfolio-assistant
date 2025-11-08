import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
      '**/tests/e2e/**', // Exclude Playwright E2E tests
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'tests/',
        '**/tests/e2e/**',
        '**/*.config.ts',
        '**/*.config.js',
        '**/main.tsx', // Entry point
        '**/types/**', // Type definitions only
        '**/*.d.ts',
        '**/test/**',
        '**/__tests__/**',
        '**/index.ts', // Re-export files
        '**/index.tsx', // Re-export files
        '**/widgets/ChatWidget/**', // Complex chat widget - tested separately
        '**/contexts/**', // Context providers - integration tested
        '**/hooks/useChat.ts', // Chat hook - integration tested
        '**/hooks/useWebSocket.ts', // WebSocket hook - integration tested
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
});
