import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { databaseConfig } from '../config/database';
import * as schema from '../models/schema';

// Connection for migrations
export const migrationClient = postgres(databaseConfig.url, {
  max: databaseConfig.migrations.max
});

// Connection for query purposes
export const queryClient = postgres(databaseConfig.url, {
  max: databaseConfig.pool.max,
  idle_timeout: databaseConfig.pool.idleTimeout,
  connect_timeout: databaseConfig.pool.connectTimeout
});

// Initialize drizzle with schema
export const db = drizzle(queryClient, { schema });

/**
 * Health check utility for database connection
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await queryClient`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
}
