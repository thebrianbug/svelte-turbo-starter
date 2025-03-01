import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db, migrationClient, queryClient, checkDatabaseConnection } from './connection';
import { users } from '../schema';
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
  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), timeoutMs);

  try {
    await db.delete(users).execute();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new DatabaseSetupError('Clean data operation timed out');
    }
    throw new DatabaseSetupError('Failed to clean test data', error);
  } finally {
    clearTimeout(timeout);
  }
}

export async function setup({
  timeout = 10, // Reduced from 30s to 10s
  migrationsPath = './drizzle'
}: DatabaseOptions = {}): Promise<void> {
  const timeoutMs = timeout * 1000;
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), timeoutMs);

  try {
    // Verify database connection
    const isConnected = await checkDatabaseConnection();
    if (!isConnected) {
      throw new DatabaseSetupError('Failed to establish database connection');
    }

    // Run migrations with absolute path and timeout
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

    // Initial data cleanup
    await cleanTestData(timeoutMs);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new DatabaseSetupError('Setup operation timed out');
    }
    console.error('Setup failed:', error);
    await teardown({ timeout: 5 }).catch(() => {
      // Ignore teardown errors on setup failure
    });
    throw error instanceof DatabaseSetupError
      ? error
      : new DatabaseSetupError('Setup failed', error);
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function teardown({ timeout = 10 }: DatabaseOptions = {}): Promise<void> {
  const timeoutMs = timeout * 1000;
  const errors: Error[] = [];

  // Close connections with individual timeouts to prevent one hanging connection from blocking others
  await Promise.all([
    migrationClient.end({ timeout: timeoutMs }).catch((error) => {
      errors.push(new Error('Migration client close failed: ' + error.message));
    }),
    queryClient.end({ timeout: timeoutMs }).catch((error) => {
      errors.push(new Error('Query client close failed: ' + error.message));
    })
  ]);

  if (errors.length > 0) {
    throw new DatabaseSetupError(
      'Failed to teardown database: ' + errors.map((e) => e.message).join(', ')
    );
  }
}

/**
 * Utility function to clean test data between tests
 */
export async function cleanBetweenTests(): Promise<void> {
  await cleanTestData(3000); // Reduced from 5s to 3s for between-test cleanup
}
