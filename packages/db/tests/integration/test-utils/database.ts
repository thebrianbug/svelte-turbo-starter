import { sql } from 'drizzle-orm';
import { getConnection } from '../../../src/database';
import type { DatabaseType, TransactionType } from '../../../src/infrastructure/base-repository';
import { createTestUserRepository, createTransactionUserRepository } from './repository-factories';
import { initializeTestDatabase, type SchemaObject } from './database-migrations';

/**
 * Type for test context that includes database connection and repositories
 */
export type TestContext = {
  connection: ReturnType<typeof getConnection>;
  db: DatabaseType;
  repositories: {
    users: ReturnType<typeof createTestUserRepository>;
  };
  cleanup: () => Promise<void>;
};

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
 * Creates a test context that uses the shared connection
 * and provides access to test repositories
 */
export function createTestContext(): TestContext {
  const connection = getSharedConnection();

  return {
    connection,
    db: connection.db,
    repositories: {
      users: createTestUserRepository(connection)
    },
    async cleanup() {}
  };
}

/**
 * Creates a test context with guaranteed schema initialization via migrations
 * This is the preferred way to create a test context for integration tests
 */
export async function createMigratedTestContext() {
  await initializeTestDatabase();
  return createTestContext();
}

/**
 * Cleans a specific table while handling foreign key constraints
 */
export async function cleanTable(
  table: SchemaObject,
  db: DatabaseType = getSharedConnection().db
): Promise<void> {
  try {
    await db.transaction(async (tx) => {
      // Temporarily disable foreign key constraints
      await tx.execute(sql`SET CONSTRAINTS ALL DEFERRED`);
      // Use Drizzle's type-safe delete
      await tx.delete(table);
    });
  } catch (error) {
    console.error(`Failed to clean table ${table.name}:`, error);
    throw error;
  }
}

/**
 * Cleans multiple related tables in a single transaction
 */
export async function cleanRelatedTables(
  primaryTable: SchemaObject,
  relatedTables: SchemaObject[],
  db: DatabaseType = getSharedConnection().db
): Promise<void> {
  try {
    await db.transaction(async (tx) => {
      await tx.execute(sql`SET CONSTRAINTS ALL DEFERRED`);
      // Delete related tables first, then primary table
      for (const table of [...relatedTables, primaryTable]) {
        await tx.delete(table);
      }
    });
  } catch (error) {
    console.error(`Failed to clean related tables for ${primaryTable.name}:`, error);
    throw error;
  }
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
