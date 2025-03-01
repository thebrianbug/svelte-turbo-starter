import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';
import * as schema from '../schema';

export interface DatabaseConfig {
  url: string;
  pool: {
    max: number;
  };
}

export function getDatabaseConfig(): DatabaseConfig {
  return {
    url: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/svelte_turbo_db',
    pool: {
      max: 10
    }
  };
}

// Get database configuration
const config = getDatabaseConfig();

// Single connection client for both queries and migrations
export const client = postgres(config.url, {
  max: config.pool.max,
  transform: {
    undefined: null
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
  try {
    await db.execute(sql`SELECT 1`);
    return true;
  } catch {
    return false;
  }
}
