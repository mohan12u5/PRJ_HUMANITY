import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      'server-only': path.resolve(__dirname, 'test/shims/server-only.ts'),
      '@': path.resolve(__dirname, '.')
    }
  },
  test: {
    environment: 'node',
    include: ['**/*.test.ts']
  }
});
