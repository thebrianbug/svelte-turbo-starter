import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

// Base configuration that can be extended by apps
export const baseViteConfig = {
  plugins: [sveltekit()],
  test: {
    exclude: ['**/node_modules/**', '**/tests/**', '**/tests-examples/**']
  }
};

// Helper to create app-specific config
export function createViteConfig(options) {
  return defineConfig({
    ...baseViteConfig,
    server: {
      port: options.port
    },
    preview: {
      port: options.port
    }
  });
}

// Default config if used directly
export default defineConfig(baseViteConfig);
