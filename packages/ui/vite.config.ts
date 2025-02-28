import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  test: {
    environment: 'jsdom',
    include: ['**/*.{test,spec}.{js,ts}'],
    setupFiles: ['./test/setup.ts']
  },
  resolve: process.env.VITEST
    ? {
        conditions: ['browser']
      }
    : undefined
});
