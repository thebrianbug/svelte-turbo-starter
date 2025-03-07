import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { users } from '../domains/users/schema/schema';
import { getDatabaseConfig } from './config';
import { sql } from 'drizzle-orm';

const client = postgres(getDatabaseConfig(), {
  transform: { undefined: null },
  max: 1,
  idle_timeout: 5,
  connect_timeout: 5,
  max_lifetime: 15
});

export const db = drizzle(client, {
  schema: { users },
  logger: process.env.NODE_ENV !== 'test'
});

export { client };

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await db.execute(sql`SELECT 1`);
    return true;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
}
