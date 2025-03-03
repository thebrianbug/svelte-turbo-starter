import path from 'path';

import { migrate } from 'drizzle-orm/postgres-js/migrator';

import { db, client } from '../../../src/database';
import { users } from '../../../src/domains/users/schema';

class DatabaseSetupError extends Error {
  constructor(
    message: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'DatabaseSetupError';
  }
}

type DatabaseOptions = {
  /**
   * Timeout in seconds for database operations
   * @default 10
   */
  timeout?: number;
  /**
   * Path to migrations folder
   * @default './drizzle'
   */
  migrationsPath?: string;
};

/**
 * Cleans all test data from the database
 */
async function cleanTestData(timeoutMs: number): Promise<void> {
  const cleanupPromise = db.delete(users).execute();

  try {
    await Promise.race([
      cleanupPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Cleanup timeout')), timeoutMs))
    ]);
  } catch (error) {
    if (error instanceof Error && error.message === 'Cleanup timeout') {
      throw new DatabaseSetupError('Database cleanup timed out');
    }
    throw error;
  }
}

export async function setup({
  timeout = 10,
  migrationsPath = './drizzle'
}: DatabaseOptions = {}): Promise<void> {
  const timeoutMs = timeout * 1000;

  try {
    // Run migrations with absolute path and timeout
    const absoluteMigrationsPath = path.resolve(process.cwd(), migrationsPath);
    const migrationPromise = migrate(db, { migrationsFolder: absoluteMigrationsPath });

    try {
      await Promise.race([
        migrationPromise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Migration timeout')), timeoutMs)
        )
      ]);
    } catch (error) {
      if (error instanceof Error && error.message === 'Migration timeout') {
        throw new DatabaseSetupError('Database migration timed out');
      }
      throw new DatabaseSetupError('Migration failed', error);
    }

    // Initial data cleanup
    await cleanTestData(timeoutMs);
  } catch (error) {
    // Ensure teardown happens if setup fails
    try {
      await teardown({ timeout: 5 });
    } catch (teardownError) {
      console.error('Teardown failed during setup error handling:', teardownError);
    }
    throw error instanceof DatabaseSetupError
      ? error
      : new DatabaseSetupError('Setup failed', error);
  }
}

export async function teardown({ timeout = 10 }: DatabaseOptions = {}): Promise<void> {
  const timeoutMs = timeout * 1000;

  try {
    // First try to clean up any remaining test data
    try {
      await cleanTestData(timeoutMs);
    } catch (error) {
      console.warn('Failed to clean test data during teardown:', error);
    }

    // End the database connection
    const endPromise = client.end();
    await Promise.race([
      endPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Teardown timeout')), timeoutMs))
    ]);
  } catch (error) {
    if (error instanceof Error && error.message === 'Teardown timeout') {
      throw new DatabaseSetupError('Database teardown timed out');
    }
    throw new DatabaseSetupError('Teardown failed', error);
  }
}

/**
 * Utility function to clean test data between tests
 */
export async function cleanBetweenTests(): Promise<void> {
  await cleanTestData(3000);
}
