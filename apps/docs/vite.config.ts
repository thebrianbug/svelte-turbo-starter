import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    port: 3001
  },
  preview: {
    port: 3001
  },
  test: {
    exclude: ['**/node_modules/**', '**/tests/**']
  }
});
