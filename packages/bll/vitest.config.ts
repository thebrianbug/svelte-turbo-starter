import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts']
    }
  },
  resolve: {
    alias: {
      '@svelte-turbo/db': '/home/brianbug/source/svelte-turbo-starter/packages/db'
    }
  }
});
