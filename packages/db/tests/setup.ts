import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db, migrationClient, queryClient, checkDatabaseConnection, users } from '../index';

interface SetupOptions {
  /**
   * Whether to run migrations during setup
   * @default true
   */
  runMigrations?: boolean;
  /**
   * Whether to clean existing data during setup
   * @default true
   */
  cleanData?: boolean;
  /**
   * Timeout in seconds for database operations
   * @default 30
   */
  timeout?: number;
}

export async function setup(options: SetupOptions = {}): Promise<void> {
  const {
    runMigrations = true,
    cleanData = true,
    timeout = 30
  } = options;

  try {
    // First verify database connection
    const isConnected = await checkDatabaseConnection();
    if (!isConnected) {
      throw new Error('Failed to establish database connection');
    }

    if (runMigrations) {
      // Run migrations to ensure database schema is up to date
      await migrate(db, { migrationsFolder: './drizzle' });
      console.log('Migrations completed successfully');
    }

    if (cleanData) {
      // Clean existing test data
      await db.delete(users).execute();
      console.log('Test data cleaned successfully');
    }
  } catch (error) {
    console.error('Setup failed:', error);
    // Attempt to close connections on setup failure
    await teardown({ timeout });
    throw error;
  }
}

interface TeardownOptions {
  /**
   * Whether to clean existing data during teardown
   * @default true
   */
  cleanData?: boolean;
  /**
   * Timeout in seconds for closing connections
   * @default 30
   */
  timeout?: number;
}

export async function teardown(options: TeardownOptions = {}): Promise<void> {
  const {
    cleanData = true,
    timeout = 30
  } = options;

  try {
    if (cleanData) {
      // Clean up test data
      await db.delete(users).execute();
      console.log('Test data cleaned successfully');
    }

    // Close all database connections with configurable timeout
    await Promise.all([
      migrationClient.end({ timeout }),
      queryClient.end({ timeout })
    ]);
    console.log('Database connections closed successfully');
  } catch (error) {
    console.error('Teardown failed:', error);
    throw error;
  }
}
