import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString =
  process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/svelte_turbo_db';

// Connection for migrations
export const migrationClient = postgres(connectionString, { max: 1 });

// Connection for query purposes
const queryClient = postgres(connectionString, {
  max: 10, // connection pool size
  idle_timeout: 20, // max idle time for connections
  connect_timeout: 10, // connection timeout in seconds
});

export const db = drizzle(queryClient, { schema });

// Export everything needed for bll package
export * from './schema';
export * from './utils';
export * from './users';

// Health check utility
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await queryClient`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
}
