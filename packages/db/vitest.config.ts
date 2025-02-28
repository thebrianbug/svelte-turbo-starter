import { defineConfig } from 'vitest/config';
import type { UserConfig } from 'vitest';

export default defineConfig({
  test: {
    globalSetup: './src/database/test-setup.ts',
    globalTeardown: './src/database/test-teardown.ts',
    setupFiles: ['dotenv/config'],
    testTimeout: 10000,
    poolOptions: {
      threads: {
        singleThread: true,
        maxThreads: 1
      }
    },
    reporters: ['default', 'hanging-process']
  }
});
