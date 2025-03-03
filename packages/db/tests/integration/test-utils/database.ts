import path from 'path';

import { migrate } from 'drizzle-orm/postgres-js/migrator';

import { db, client } from '../../../src/database';

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
 * Resets the database state for testing
 */
async function resetDatabase(timeoutMs: number): Promise<void> {
  try {
    await Promise.race([
      client.unsafe(`
        DO $$ 
        BEGIN
          IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
            TRUNCATE TABLE "users" CASCADE;
          END IF;
        END $$;
      `),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database reset timeout')), timeoutMs)
      )
    ]);

    // Add a small delay to ensure reset has completed
    await new Promise((resolve) => setTimeout(resolve, 100));
  } catch (error) {
    if (error instanceof Error && error.message === 'Database reset timeout') {
      throw new DatabaseSetupError('Database reset timed out');
    }
    throw new DatabaseSetupError('Database reset failed', error);
  }
}

export async function setup({
  timeout = 10,
  migrationsPath = './drizzle'
}: DatabaseOptions = {}): Promise<void> {
  const timeoutMs = timeout * 1000;

  try {
    // First reset database state
    await resetDatabase(timeoutMs);

    // Then run migrations with absolute path and timeout
    const absoluteMigrationsPath = path.resolve(process.cwd(), migrationsPath);
    const migrationPromise = migrate(db, { migrationsFolder: absoluteMigrationsPath });

    try {
      await Promise.race([
        migrationPromise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Migration timeout')), timeoutMs)
        )
      ]);

      // Add a small delay to ensure migrations have completed
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      if (error instanceof Error && error.message === 'Migration timeout') {
        throw new DatabaseSetupError('Database migration timed out');
      }
      throw new DatabaseSetupError('Migration failed', error);
    }
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
    // Clean up database state before closing connection
    try {
      await resetDatabase(timeoutMs);
    } catch (error) {
      console.warn('Failed to reset database during teardown:', error);
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
 * Utility function to reset database between tests
 */
export async function cleanBetweenTests(): Promise<void> {
  await resetDatabase(3000);
}
