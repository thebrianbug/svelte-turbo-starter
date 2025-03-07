import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { users } from '../domains/users/schema';
import { getDatabaseConfig } from './config';

// Create postgres client with optimized settings
const client = postgres(getDatabaseConfig(), {
  transform: { undefined: null },
  max: 1,
  idle_timeout: 5,
  connect_timeout: 5,
  max_lifetime: 15
});

// Initialize and export drizzle instance
export const db = drizzle(client, {
  schema: { users },
  logger: process.env.NODE_ENV !== 'test'
});

export { client };
