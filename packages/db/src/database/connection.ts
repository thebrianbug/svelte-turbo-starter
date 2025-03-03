import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from '../domains/users/schema';
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
    max_lifetime: 15, // Match GitHub Actions connection check timeout
    connection: {
      attempts: 5, // Match GitHub Actions health retries
      backoff: 500 // 500ms between retries
    }
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
