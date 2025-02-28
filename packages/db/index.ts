import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString =
  process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/svelte_turbo_db';

// Connection for migrations
export const migrationClient = postgres(connectionString, { max: 1 });

// Connection for query purposes
const queryClient = postgres(connectionString);
export const db = drizzle(queryClient, { schema });

// Export schema for use in other parts of the application
export * from './schema';
