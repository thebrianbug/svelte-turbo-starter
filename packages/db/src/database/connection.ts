import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { users } from '../domains/users/schema/schema';
import { getDatabaseConfig, loadEnvConfigForNonTestEnv } from './config';
import { sql } from 'drizzle-orm';

// Create a function to initialize the database connection when needed
export const createDbConnection = () => {
  loadEnvConfigForNonTestEnv();

  const client = postgres(getDatabaseConfig(), {
    transform: { undefined: null },
    max: 1,
    idle_timeout: 5,
    connect_timeout: 5,
    max_lifetime: 15
  });

  return {
    db: drizzle(client, {
      schema: { users },
      logger: process.env.NODE_ENV !== 'test'
    }),
    client
  };
};

// Lazy initialization of the database
let _connection: ReturnType<typeof createDbConnection> | null = null;

export const getConnection = () => {
  if (!_connection) {
    _connection = createDbConnection();
  }
  return _connection;
};

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const { db } = getConnection();
    await db.execute(sql`SELECT 1`);
    return true;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
}
