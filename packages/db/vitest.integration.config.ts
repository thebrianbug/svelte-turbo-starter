import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['dotenv/config', './src/database/test-setup.ts'],
    testTimeout: 5000,
    include: ['src/**/*.integration.test.ts'],
    exclude: ['src/**/!(*integration).test.ts'],
    poolOptions: {
      threads: {
        singleThread: true,
        maxThreads: 1
      }
    },
    reporters: ['default'],
    silent: true
  }
});
