import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { svelteTesting } from '@testing-library/svelte/vite';

export default defineConfig({
  plugins: [svelte(), svelteTesting()],
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
