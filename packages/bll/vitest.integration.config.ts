import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
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
    silent: false,
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgres://postgres:postgres@localhost:5432/svelte_turbo_test_db'
    }
  }
});
