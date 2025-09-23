/// <reference types="vitest" />
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    include: [
      'tests/**/*.test.{js,jsx,ts,tsx}',
    ],
    exclude: [
      'node_modules/',
      'dist/',
      'services/testSuite/realTests/**',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});