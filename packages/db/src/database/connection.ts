import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { databaseConfig } from '../config/database';
import * as schema from '../models';

// Connection for migrations
export const migrationClient = postgres(databaseConfig.url, {
  max: databaseConfig.migration.max,
  idle_timeout: databaseConfig.migration.idleTimeout,
  max_lifetime: databaseConfig.migration.maxLifetime,
  connection: {
    application_name: 'db_migration_client'
  }
});

// Connection for queries with optimized pooling
export const queryClient = postgres(databaseConfig.url, {
  max: databaseConfig.pool.max,
  idle_timeout: databaseConfig.pool.idleTimeout,
  max_lifetime: databaseConfig.pool.maxLifetime,
  connect_timeout: databaseConfig.pool.connectTimeout,
  connection: {
    application_name: 'db_query_client'
  }
});

// Initialize drizzle with schema
export const db = drizzle(queryClient, { schema });

/**
 * Health check utility for database connection
 * @returns Promise<boolean> true if connection is healthy, false otherwise
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

// Ensure connections are properly closed on process termination
process.on('SIGTERM', () => {
  void Promise.all([
    migrationClient.end(),
    queryClient.end()
  ]).then(() => process.exit(0));
});
