import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db, migrationClient, queryClient, checkDatabaseConnection, users } from '../index';
import path from 'path';

class DatabaseSetupError extends Error {
  constructor(message: string, public originalError?: unknown) {
    super(message);
    this.name = 'DatabaseSetupError';
  }
}

interface DatabaseOptions {
  /**
   * Timeout in seconds for database operations
   * @default 30
   */
  timeout?: number;
  /**
   * Path to migrations folder
   * @default './drizzle'
   */
  migrationsPath?: string;
}

/**
 * Cleans all test data from the database
 */
async function cleanTestData(timeoutMs: number): Promise<void> {
  try {
    await Promise.race([
      db.delete(users).execute(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Clean data timeout')), timeoutMs)
      )
    ]);
  } catch (error) {
    throw new DatabaseSetupError('Failed to clean test data', error);
  }
}

export async function setup({ 
  timeout = 30,
  migrationsPath = './drizzle'
}: DatabaseOptions = {}): Promise<void> {
  const timeoutMs = timeout * 1000;

  try {
    // Verify database connection with timeout
    const connectionPromise = checkDatabaseConnection();
    const isConnected = await Promise.race([
      connectionPromise,
      new Promise<boolean>((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), timeoutMs)
      )
    ]);

    if (!isConnected) {
      throw new DatabaseSetupError('Failed to establish database connection');
    }

    // Run migrations with absolute path
    const absoluteMigrationsPath = path.resolve(process.cwd(), migrationsPath);
    await migrate(db, { migrationsFolder: absoluteMigrationsPath });

    // Initial data cleanup
    await cleanTestData(timeoutMs);
  } catch (error) {
    console.error('Setup failed:', error);
    // Attempt to close connections on setup failure
    await teardown({ timeout });
    throw error instanceof DatabaseSetupError ? error : new DatabaseSetupError('Setup failed', error);
  }
}

export async function teardown({ timeout = 30 }: DatabaseOptions = {}): Promise<void> {
  const timeoutMs = timeout * 1000;

  try {
    // Close all database connections with timeout
    await Promise.race([
      Promise.all([
        migrationClient.end(),
        queryClient.end()
      ]),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection close timeout')), timeoutMs)
      )
    ]);
  } catch (error) {
    throw new DatabaseSetupError('Failed to teardown database', error);
  }
}

/**
 * Utility function to clean test data between tests
 */
export async function cleanBetweenTests(): Promise<void> {
  await cleanTestData(5000); // 5 second timeout for between-test cleanup
}
