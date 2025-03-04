import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { users } from '../domains/users/schema';

// Schema object for drizzle configuration
const schema = { users };
import { getDatabaseConfig } from './config';

// Create and export database connection
export function createDatabase() {
  const databaseUrl = getDatabaseConfig();

  // Single connection client for both queries and migrations
  const client = postgres(databaseUrl, {
    transform: {
      undefined: null
    },
    // Add connection settings
    max: 1, // Limit pool size for tests
    idle_timeout: 5, // Match GitHub Actions health check timeout
    connect_timeout: 5, // Match GitHub Actions health check timeout
    max_lifetime: 15 // Match GitHub Actions connection check timeout
  });

  // Initialize drizzle with schema and logging
  const db = drizzle(client, {
    schema,
    logger: process.env.NODE_ENV !== 'test'
  });

  return { client, db };
}

// Initialize database connection
export const { client, db } = createDatabase();
