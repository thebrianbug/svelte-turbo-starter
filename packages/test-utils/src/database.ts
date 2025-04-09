import { DatabaseError } from '@repo/shared/src/errors/database.error';
import { schema, type TransactionType, type DatabaseType } from '@repo/db';
import postgres from 'postgres';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/postgres-js';
import type { Sql } from 'postgres';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Define types for Drizzle connection
// Use DatabaseType from @repo/db
export type TestDbConnection = DatabaseType;

// Export context types for test database operations
export type TestDatabaseContext = {
  db: DatabaseType;
  client: Sql;
};

export type TestTransactionContext = {
  tx: TransactionType;
};

// Hold the singleton connection and client
let testDbConnection: TestDbConnection | null = null;
let testClient: Sql | null = null;

// Error specifically for forcing rollbacks in tests
// Can optionally carry a result if needed by the calling test
class RollbackTestTransaction<T = unknown> extends Error {
  result?: T;
  constructor(result?: T) {
    super('Rolling back test transaction');
    this.name = 'RollbackTestTransaction';
    this.result = result;
  }
}

/**
 * Retrieves the database connection string for the test environment.
 * Expects TEST_DATABASE_URL to be set.
 */
const getTestDatabaseConfig = (): string => {
  if (!process.env.TEST_DATABASE_URL) {
    throw new Error('TEST_DATABASE_URL environment variable is required for tests');
  }
  return process.env.TEST_DATABASE_URL;
};

/**
 * Creates the Drizzle instance for the test database.
 */
const createTestDbConnection = () => {
  try {
    // Use postgres driver
    testClient = postgres(getTestDatabaseConfig(), {
      max: 1, // Ensure single connection for test predictability
      idle_timeout: 5,
      transform: { undefined: null }
    });

    // Initialize Drizzle
    testDbConnection = drizzle(testClient, {
      schema // Use the imported schema object
      // logger: true, // Uncomment for debugging
    });

    return { db: testDbConnection, client: testClient };
  } catch (error) {
    throw DatabaseError.from('TestDatabase', error, 'createTestConnection');
  }
};

/**
 * Initializes the test database connection and runs migrations.
 * Ensures the database is clean and schema is up-to-date before tests start.
 */
export async function initializeTestDatabase(): Promise<void> {
  if (testDbConnection) {
    console.warn('Test database already initialized.');
    return;
  }

  console.log('Initializing test database...');
  try {
    createTestDbConnection();
    if (!testDbConnection || !testClient) {
      throw new Error('Test database connection failed to initialize.');
    }

    console.log('Running migrations on test database...');
    // Construct path relative to the current file
    const currentFilePath = fileURLToPath(import.meta.url);
    const currentDirPath = path.dirname(currentFilePath);
    // Go up one level from src, then expect db package as sibling
    const migrationsPath = path.resolve(currentDirPath, '..', '..', 'db', 'migrations');
    await migrate(testDbConnection, { migrationsFolder: migrationsPath });

    console.log('Test database initialized successfully.');
  } catch (error) {
    await closeTestConnection(); // Ensure cleanup on failure
    throw DatabaseError.from('TestDatabase', error, 'initializeTestDatabase');
  }
}

/**
 * Closes the test database connection.
 * Called after all tests have finished.
 */
export async function closeTestConnection(): Promise<void> {
  console.log('Closing test database connection...');
  if (testClient) {
    await testClient.end({ timeout: 5 });
    testClient = null;
    testDbConnection = null;
    console.log('Test database connection closed.');
  }
}

/**
 * Executes a given function within a database transaction.
 * The transaction is automatically rolled back after execution for test isolation.
 *
 * @param callback The function to execute within the transaction.
 * @returns The result of the callback function (though typically undefined due to rollback).
 */
export async function executeTestInTransaction<T>(
  callback: (tx: TransactionType) => Promise<T>
): Promise<T> {
  if (!testDbConnection) {
    throw new Error('Test database not initialized. Call initializeTestDatabase first.');
  }

  console.log('Executing test in transaction...');
  try {
    const result = await testDbConnection.transaction(async (tx) => {
      const callbackResult = await callback(tx);
      // Force rollback after successful execution by throwing a specific error
      throw new RollbackTestTransaction(callbackResult); // Pass result to error
    });
    // This line should not be reached due to the forced rollback
    return result; // Will be undefined/empty
  } catch (error) {
    if (error instanceof RollbackTestTransaction) {
      console.log('Test transaction rolled back successfully.');
      return error.result ?? undefined;
    }
    // Rethrow unexpected errors
    throw DatabaseError.from('TestDatabase', error, 'executeTestInTransaction');
  }
}

/**
 * Verifies the state of the database, often after a UI action.
 * Executes the verification logic within a transaction that is rolled back.
 *
 * @param callback The function containing database assertions.
 */
export async function verifyDatabaseState(
  callback: (tx: TransactionType) => Promise<void>
): Promise<void> {
  if (!testDbConnection) {
    throw new Error('Test database not initialized. Call initializeTestDatabase first.');
  }

  console.log('Verifying database state in transaction...');
  try {
    await testDbConnection.transaction(async (tx) => {
      await callback(tx); // Execute callback
      // Force rollback after successful verification - no result needed here
      throw new RollbackTestTransaction();
    });
  } catch (error) {
    if (error instanceof RollbackTestTransaction) {
      console.log('Verification transaction rolled back successfully.');
    } else {
      // Rethrow actual errors that occurred during verification
      throw DatabaseError.from('TestDatabase', error, 'verifyDatabaseState');
    }
  }
}
