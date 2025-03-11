// No longer need sql import after removing cleanup functions
import { getConnection } from '../../../src/database';
import type { DatabaseType, TransactionType } from '../../../src/infrastructure/base-repository';
import { createTransactionUserRepository } from './repository-factories';
import { initializeTestDatabase } from './database-migrations';

/**
 * Type for transaction-based test context
 */
export type TransactionTestContext = {
  tx: TransactionType;
  repositories: {
    users: ReturnType<typeof createTransactionUserRepository>;
  };
};

// Shared connection for tests to avoid connection churn
let sharedConnection: ReturnType<typeof getConnection> | null = null;

/**
 * Get a shared database connection for tests
 * This prevents creating too many connections during tests
 */
export function getSharedConnection() {
  if (!sharedConnection) {
    sharedConnection = getConnection();
  }
  return sharedConnection;
}

/**
 * Initializes the database schema via migrations and returns the shared connection
 * This is the preferred way to setup the database for integration tests
 */
export async function createMigratedTestContext() {
  await initializeTestDatabase();
  return getSharedConnection();
}

/**
 * Close the shared database connection
 * This should be called in afterAll hooks
 */
export async function closeTestConnection(): Promise<void> {
  if (sharedConnection) {
    try {
      await sharedConnection.client.end();
      sharedConnection = null;
    } catch (error) {
      console.error('Failed to close test database connection:', error);
    }
  }
}

/**
 * Creates a test context that uses a transaction
 * All operations performed through this context will be rolled back
 */
export function createTransactionTestContext(tx: TransactionType): TransactionTestContext {
  return {
    tx,
    repositories: {
      users: createTransactionUserRepository(tx)
    }
  };
}

/**
 * Executes a test within a transaction that is rolled back afterward
 * This provides isolation without explicit cleanup
 */
export async function executeTestInTransaction<T>(
  testFn: (tx: TransactionType) => Promise<T>,
  db: DatabaseType = getSharedConnection().db
): Promise<T> {
  let result: T;

  await db
    .transaction(async (tx) => {
      // Run the test with the transaction
      result = await testFn(tx);

      // Always roll back by throwing a special error that we can catch
      throw new Error('__ROLLBACK_TRANSACTION__');
    })
    .catch((err) => {
      // Ignore our special rollback error
      if (err.message !== '__ROLLBACK_TRANSACTION__') {
        throw err;
      }
    });

  return result!;
}

/**
 * Helper function to run a test within a transaction for better isolation
 * @param testFn Function containing test logic that receives a repository
 * @param repoGetter Function that returns a repository from a transaction
 * @param db Database connection to use (defaults to shared connection)
 */
export async function withTransactionTest<R>(
  testFn: (repo: R) => Promise<void>,
  repoGetter: (tx: TransactionType) => R,
  db: DatabaseType = getSharedConnection().db
): Promise<void> {
  await executeTestInTransaction(async (tx) => {
    const repository = repoGetter(tx);
    await testFn(repository);
  }, db);
}

// Error assertions have been moved to test-assertions.ts
export { ErrorAssertions } from './test-assertions';
