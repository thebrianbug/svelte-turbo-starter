import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres, { type Sql } from 'postgres';
import { DatabaseError } from '@repo/shared/src/errors/database.error';
// Import the specific schema being used
import { users } from '@repo/db';

// Define types for Drizzle connection and transaction contexts
const testSchema = { users };
export type TestDatabaseContext = PostgresJsDatabase<typeof testSchema>;
export type TestTransactionContext = Parameters<
  Parameters<TestDatabaseContext['transaction']>[0]
>[0];

// Hold the singleton connection and client
let testDbConnection: TestDatabaseContext | null = null;
let testClient: Sql | null = null;

// Error specifically for forcing rollbacks in tests
class RollbackTestTransaction extends Error {
  constructor() {
    super('Rolling back test transaction');
    this.name = 'RollbackTestTransaction';
  }
}

/**
 * Retrieves the database connection string for the test environment.
 * Expects TEST_DATABASE_URL to be set.
 */
const getTestDatabaseConfig = (): string => {
  if (!process.env.TEST_DATABASE_URL) {
    throw new Error('TEST_DATABASE_URL environment variable is required for E2E tests');
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
      // Consider test-specific settings if needed
      max: 1, // Ensure single connection for test predictability if required
      idle_timeout: 5,
      transform: { undefined: null }
    });

    // Initialize Drizzle
    testDbConnection = drizzle(testClient, {
      schema: testSchema // Use the imported schema object
      // Disable logger in tests unless debugging
      // logger: true,
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
    // TODO: Adjust the migrationsFolder path as needed
    // Usually relative to the drizzle.config.ts or where migrations are stored
    // Example assumes migrations are in packages/db/migrations
    await migrate(testDbConnection, { migrationsFolder: '../../packages/db/migrations' });

    // TODO: Implement logic to seed permanent baseline data if required
    // console.log('Seeding baseline test data...');
    // await seedBaselineData(testDbConnection);

    console.log('Test database initialized successfully.');
  } catch (error) {
    // Ensure connection is closed on initialization failure
    await closeTestConnection();
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
 * @returns The result of the callback function.
 */
export async function executeTestInTransaction<T>(
  callback: (tx: TestTransactionContext) => Promise<T>
): Promise<T> {
  if (!testDbConnection) {
    throw new Error('Test database not initialized. Call initializeTestDatabase first.');
  }

  console.log('Executing test in transaction...');
  try {
    // Wrap the callback in a transaction
    const result = await testDbConnection.transaction(
      async (tx) => {
        await callback(tx); // Execute callback, ignore result before rollback
        // Force rollback after successful execution by throwing a specific error
        throw new RollbackTestTransaction();
      }
      // Optional: Configure transaction options if needed
      // { isolationLevel: 'serializable' }
    );
    // This line should ideally not be reached due to the forced rollback
    return result;
  } catch (error) {
    // Check if it's the specific rollback error, otherwise rethrow
    if (error instanceof RollbackTestTransaction) {
      console.log('Test transaction rolled back successfully.');
      // We need to return a default/undefined value as the transaction was rolled back
      // The actual result from `callback` is lost due to rollback.
      // If the callback *needs* to return a value to the test, structure the test differently.
      // Often, the purpose is side-effects (creating data) which are verified later.
      // @ts-expect-error We expect result to be undefined after rollback
      return undefined;
    } else {
      throw DatabaseError.from('TestDatabase', error, 'executeTestInTransaction');
    }
  }
}

/**
 * Verifies the state of the database, often after a UI action.
 * Executes the verification logic within a transaction that is rolled back.
 *
 * @param callback The function containing database assertions.
 */
export async function verifyDatabaseState(
  callback: (tx: TestTransactionContext) => Promise<void>
): Promise<void> {
  if (!testDbConnection) {
    throw new Error('Test database not initialized. Call initializeTestDatabase first.');
  }

  console.log('Verifying database state in transaction...');
  try {
    await testDbConnection.transaction(async (tx) => {
      await callback(tx); // Execute callback, ignore result before rollback
      // Force rollback after successful verification
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
