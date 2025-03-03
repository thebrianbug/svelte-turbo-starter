import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['./tests/integration/test-setup.ts'],
    testTimeout: 5000,
    include: ['tests/integration/**/*.integration.test.ts'],
    exclude: [],
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
