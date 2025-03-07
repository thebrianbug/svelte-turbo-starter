import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables from packages/db/.env
config({ path: join(__dirname, '../../.env') });

// Get database URL, using test database in test environment
export const getDatabaseConfig = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required for database connection');
  }

  const url = new URL(process.env.DATABASE_URL);
  if (process.env.NODE_ENV === 'test') {
    url.pathname = '/svelte_turbo_test_db';
  }
  return url.toString();
};
