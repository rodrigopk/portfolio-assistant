import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'tests/',
        'prisma/',
        '**/*.config.ts',
        '**/*.config.js',
        'src/index.ts', // Entry point - hard to test in isolation
        'src/lib/prisma.ts', // Database connection - integration only
        'src/lib/redis.ts', // Redis connection - integration only
        'src/types/profile.types.ts', // Just type definitions
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
    setupFiles: ['./src/__tests__/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/routes': path.resolve(__dirname, './src/routes'),
      '@/middleware': path.resolve(__dirname, './src/middleware'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/utils': path.resolve(__dirname, './src/utils'),
    },
  },
});
