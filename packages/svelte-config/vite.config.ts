import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

// Base configuration that can be extended by apps
export const baseViteConfig = {
  plugins: [sveltekit()],
  test: {
    exclude: ['**/node_modules/**', '**/tests/**', '**/tests-examples/**']
  }
};

interface ViteConfigOptions {
  port: number;
}

// Helper to create app-specific config
export function createViteConfig(options: ViteConfigOptions) {
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
