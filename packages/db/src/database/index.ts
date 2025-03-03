import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from '../domains/users/schema';

export interface DatabaseConfig {
  url: string;
  pool: {
    max: number;
    timeout: number;
  };
}

export function getDatabaseConfig(): DatabaseConfig {
  const isTest = process.env.NODE_ENV === 'test';
  return {
    url:
      process.env.DATABASE_URL ||
      `postgres://postgres:postgres@localhost:5432/svelte_turbo_${isTest ? 'test_' : ''}db`,
    pool: {
      max: isTest ? 3 : 10,
      timeout: isTest ? 5000 : 30000
    }
  };
}

// Get database configuration
const config = getDatabaseConfig();

// Single connection client for both queries and migrations
export const client = postgres(config.url, {
  max: config.pool.max,
  connect_timeout: config.pool.timeout / 1000, // Convert to seconds
  idle_timeout: 0,
  transform: {
    undefined: null
  }
});

// Initialize drizzle with schema and logging
export const db = drizzle(client, {
  schema,
  logger: process.env.NODE_ENV !== 'test'
});

/**
 * Health check utility for database connection
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await db.execute(sql`SELECT 1`);
    return true;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
}
