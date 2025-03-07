import { config } from 'dotenv';
import { join } from 'path';

config({ path: join(__dirname, '../../.env') });

export function getDatabaseConfig(): string {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  // For test environment, always use the test database
  if (process.env.NODE_ENV === 'test') {
    const url = new URL(databaseUrl);
    url.pathname = '/svelte_turbo_test_db';
    return url.toString();
  }

  return databaseUrl;
}
