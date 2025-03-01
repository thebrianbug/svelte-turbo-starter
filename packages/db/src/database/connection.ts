import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';
import { databaseConfig } from '../config/database';
import * as schema from '../models';

// Single connection client for both queries and migrations
export const client = postgres(databaseConfig.url, {
  max: databaseConfig.pool.max,
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
