import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db, client } from '../database';
import { users } from '../schema/users';
import path from 'path';

class DatabaseSetupError extends Error {
  constructor(
    message: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'DatabaseSetupError';
  }
}

interface DatabaseOptions {
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
}

/**
 * Cleans all test data from the database
 */
async function cleanTestData(timeoutMs: number): Promise<void> {
  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), timeoutMs);

  try {
    await db.delete(users).execute();
  } catch (error) {
    if (!(error instanceof Error && error.name === 'AbortError')) {
      throw error;
    }
  } finally {
    clearTimeout(timeout);
  }
}

export async function setup({
  timeout = 10,
  migrationsPath = './drizzle'
}: DatabaseOptions = {}): Promise<void> {
  const timeoutMs = timeout * 1000;
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), timeoutMs);

  try {
    // Run migrations with absolute path and timeout
    try {
      const absoluteMigrationsPath = path.resolve(process.cwd(), migrationsPath);
      const migrationPromise = migrate(db, { migrationsFolder: absoluteMigrationsPath });

      await Promise.race([
        migrationPromise,
        new Promise((_, reject) => {
          const id = setTimeout(() => {
            reject(new Error('Migration timeout'));
          }, timeoutMs);
          abortController.signal.addEventListener('abort', () => {
            clearTimeout(id);
            reject(new Error('Migration aborted'));
          });
        })
      ]);
    } catch (error) {
      throw new DatabaseSetupError('Migration failed', error);
    }

    // Initial data cleanup
    await cleanTestData(timeoutMs);
  } catch (error) {
    await teardown({ timeout: 5 });
    throw error instanceof DatabaseSetupError
      ? error
      : new DatabaseSetupError('Setup failed', error);
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function teardown({ timeout = 10 }: DatabaseOptions = {}): Promise<void> {
  try {
    await client.end({ timeout: timeout * 1000 });
  } catch (error) {
    throw new DatabaseSetupError('Teardown failed', error);
  }
}

/**
 * Utility function to clean test data between tests
 */
export async function cleanBetweenTests(): Promise<void> {
  await cleanTestData(3000);
}
