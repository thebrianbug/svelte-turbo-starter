import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from '../domains/users/schema';

export type DatabaseConfig = {
  url: string;
  pool: {
    max: number;
    timeout: number;
  };
};

export function getDatabaseConfig(): DatabaseConfig {
  const isTest = process.env.NODE_ENV === 'test';

  // If we have separate PGUSER and PGPASSWORD, construct the URL
  let url = process.env.DATABASE_URL;
  if (!url?.startsWith('postgresql://') && process.env.PGUSER && process.env.PGPASSWORD) {
    const dbName = isTest ? 'svelte_turbo_test_db' : 'svelte_turbo_db';
    url = `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@localhost:5432/${dbName}`;
  }

  return {
    url:
      url ??
      `postgresql://postgres:postgres@localhost:5432/${isTest ? 'svelte_turbo_test_db' : 'svelte_turbo_db'}`,
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
