import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres, { type Sql } from 'postgres';
import * as schema from '../domains/users/schema/schema';
import { getConfig } from './config';
import { sql } from 'drizzle-orm';
import { DatabaseError } from '@repo/shared';

// Type for the connection object, including both Drizzle instance and the raw client
export type DbConnection = {
  db: PostgresJsDatabase<typeof schema>;
  client: Sql;
};

let _connection: DbConnection | null = null;

/**
 * Creates the database connection using postgres.js and Drizzle.
 * Uses validated environment configuration.
 * @returns The DbConnection object containing the Drizzle instance and the client.
 */
const createDbConnection = (): DbConnection => {
  const config = getConfig(); // Get validated config

  try {
    // Configure the postgres client
    // Refer to postgres.js docs for options: https://github.com/porsager/postgres
    const client = postgres(config.DATABASE_URL, {
      transform: { undefined: null }, // Recommended for Drizzle
      // Add other postgres.js options if needed (e.g., timeouts, max connections)
      max: config.NODE_ENV === 'test' ? 1 : 10, // Example: Lower connections for tests
      idle_timeout: 20, // seconds
      max_lifetime: 60 * 5 // 5 minutes
    });

    // Create the Drizzle instance
    const db = drizzle(client, {
      schema, // Use the imported combined schema
      logger: config.NODE_ENV !== 'test' // Use validated NODE_ENV for logging
    });

    console.info('Database connection established using postgres.js');
    return { db, client };
  } catch (error) {
    console.error('Failed to create database connection:', error);
    throw DatabaseError.from('Database', error, 'createConnection');
  }
};

/**
 * Gets the singleton database connection instance.
 * Creates the connection on the first call.
 * @returns The DbConnection object.
 */
export const getConnection = (): DbConnection => {
  if (!_connection) {
    _connection = createDbConnection();
  }
  return _connection;
};

/**
 * Checks if the database connection is active by executing a simple query.
 * @returns True if the connection is successful, throws DatabaseError otherwise.
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const { db } = getConnection(); // Get the Drizzle instance
    await db.execute(sql`SELECT 1`);
    console.info('Database connection check successful.');
    return true;
  } catch (error) {
    console.error('Database connection check failed:', error);
    throw DatabaseError.from('Database', error, 'checkConnection');
  }
}

/**
 * Closes the underlying postgres.js database connection.
 * Should be called on application shutdown.
 */
export const closeDbConnection = async (): Promise<void> => {
  if (_connection) {
    await _connection.client.end({ timeout: 5 }); // Give 5 seconds to close gracefully
    _connection = null;
    console.info('Database connection closed.');
  }
};
