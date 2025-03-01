import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';
import * as schema from '../schema';

export interface DatabaseConfig {
  url: string;
  pool: {
    max: number;
    connectionTimeoutMs?: number;
    maxRetries?: number;
    retryIntervalMs?: number;
  };
}

export function getDatabaseConfig(): DatabaseConfig {
  const isTest = process.env.NODE_ENV === 'test';
  const defaultUrl = isTest
    ? 'postgres://postgres:postgres@localhost:5432/svelte_turbo_test_db'
    : 'postgres://postgres:postgres@localhost:5432/svelte_turbo_db';

  return {
    url: process.env.DATABASE_URL || defaultUrl,
    pool: {
      max: isTest ? 3 : 10, // Reduce connections for test environment
      connectionTimeoutMs: isTest ? 5000 : 30000,
      maxRetries: isTest ? 3 : 1,
      retryIntervalMs: isTest ? 1000 : 0
    }
  };
}

// Get database configuration
const config = getDatabaseConfig();

// Single connection client for both queries and migrations
export const client = postgres(config.url, {
  max: config.pool.max,
  connect_timeout: config.pool.connectionTimeoutMs
    ? config.pool.connectionTimeoutMs / 1000
    : undefined, // Convert to seconds
  idle_timeout: 0, // Disable idle timeout in test environment
  transform: {
    undefined: null
  },
  onnotice: () => {
    // Suppress notice messages during tests
    if (process.env.NODE_ENV !== 'test') {
      console.log;
    }
  }
});

// Initialize drizzle with schema and logging
export const db = drizzle(client, {
  schema,
  logger: true
});

/**
 * Health check utility for database connection
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  const retries = config.pool.maxRetries || 1;
  const interval = config.pool.retryIntervalMs || 0;
  let lastError: unknown;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await db.execute(sql`SELECT 1`);
      return result.length > 0;
    } catch (error) {
      lastError = error;
      if (attempt === retries) {
        console.error('Database connection check failed after', retries, 'attempts:', error);
        return false;
      }
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
  }

  console.error('Database connection check failed:', lastError);
  return false;
}
