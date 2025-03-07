import { config } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Move environment loading to an explicit function instead of loading at module level
export const loadEnvConfig = (): void => {
  // Get the directory name in ESM context
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  config({ path: join(__dirname, '../../.env') });
};

export const getDatabaseConfig = (): string => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required for database connection');
  }

  const url = new URL(process.env.DATABASE_URL);
  if (process.env.NODE_ENV === 'test') {
    url.pathname = '/svelte_turbo_test_db';
  }
  return url.toString();
};
