import { config } from '@repo/eslint-config/index.js';

export default [
  ...config,
  {
    ignores: ['drizzle/*'] // Ignore generated drizzle files
  }
];
