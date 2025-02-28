import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { databaseConfig } from '../config/database';
import * as schema from '../models';

// Connection for migrations - single connection that closes immediately when idle
export const migrationClient = postgres(databaseConfig.url, {
  max: 1,
  idle_timeout: 1, // Close after 1s idle
  max_lifetime: 5, // Max 5s connection lifetime
  connection: {
    application_name: 'db_migration_client'
  }
});

// Connection for query purposes - minimal pool with aggressive timeouts
export const queryClient = postgres(databaseConfig.url, {
  max: 3, // Reduce max connections
  idle_timeout: 2, // Close after 2s idle
  max_lifetime: 10, // Max 10s connection lifetime
  connect_timeout: 5, // 5s connect timeout
  connection: {
    application_name: 'db_query_client'
  }
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
