import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: [
      'dotenv/config',
      './src/database/test-setup.ts',
      './src/database/test-teardown.ts'
    ],
    testTimeout: 5000,
    poolOptions: {
      threads: {
        singleThread: true,
        maxThreads: 1
      }
    },
    reporters: ['default', 'hanging-process']
  }
});
