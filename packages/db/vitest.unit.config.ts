import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['./src/database/test-setup.unit.ts'],
    include: ['src/**/*.test.ts'],
    exclude: ['src/**/*.integration.test.ts'],
    reporters: ['default']
  }
});
