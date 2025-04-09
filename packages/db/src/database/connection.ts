import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { getDatabaseConfig, loadEnvConfigForNonTestEnv } from './config';
import { sql } from 'drizzle-orm';
import { DatabaseError } from '@repo/shared';
import { schema } from '../schema';

// Create a function to initialize the database connection when needed
export const createDbConnection = () => {
  loadEnvConfigForNonTestEnv();

  try {
    const client = postgres(getDatabaseConfig(), {
      transform: { undefined: null },
      max: 1,
      idle_timeout: 5,
      connect_timeout: 5,
      max_lifetime: 15
    });

    return {
      db: drizzle(client, {
        schema,
        logger: process.env.NODE_ENV !== 'test'
      }),
      client
    };
  } catch (error) {
    throw DatabaseError.from('Database', error, 'createConnection');
  }
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
    throw DatabaseError.from('Database', error, 'checkConnection');
  }
}
