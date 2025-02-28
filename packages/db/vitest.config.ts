import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globalSetup: './src/database/test-setup.ts',
    setupFiles: ['dotenv/config'],
    testTimeout: 20000,
    poolOptions: {
      threads: {
        singleThread: true
      }
    },
    reporters: ['default', 'hanging-process']
  },
});
