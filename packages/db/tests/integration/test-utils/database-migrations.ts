import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/postgres-js';
import { join } from 'path';
import { existsSync } from 'fs';
import { sql } from 'drizzle-orm';
import { getSharedConnection } from './database';
import { DatabaseError } from '@repo/shared';

// Define known tables in the system
export const TABLES = {
  USERS: 'users'
  // Add other tables as they are created
} as const;

export type TableName = (typeof TABLES)[keyof typeof TABLES];

const MAIN_MIGRATIONS_DIR = join(__dirname, '../../../../src/migrations');
const MIGRATIONS_AVAILABLE =
  existsSync(MAIN_MIGRATIONS_DIR) && existsSync(join(MAIN_MIGRATIONS_DIR, 'meta'));

export async function applyTestMigrations(): Promise<void> {
  if (!MIGRATIONS_AVAILABLE) return;

  const connection = getSharedConnection();
  const db = drizzle(connection.client);

  try {
    await migrate(db, { migrationsFolder: MAIN_MIGRATIONS_DIR });
  } catch (error: unknown) {
    throw new DatabaseError('MIGRATION_FAILED', 'Failed to apply test migrations', {
      operation: 'applyTestMigrations',
      originalError: error instanceof Error ? error.message : String(error)
    });
  }
}

export async function verifyMigratedSchema(
  tableNames: string[] = Object.values(TABLES)
): Promise<boolean> {
  const connection = getSharedConnection();
  const db = connection.db;

  try {
    const tableChecks = tableNames.map(async (tableName) => {
      const result = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = ${tableName}
        )
      `);

      return !!result[0]?.exists;
    });

    return (await Promise.all(tableChecks)).every(Boolean);
  } catch {
    return false;
  }
}

export async function initializeTestDatabase(): Promise<void> {
  try {
    await applyTestMigrations();
    const isValid = await verifyMigratedSchema();

    if (!isValid && MIGRATIONS_AVAILABLE) {
      throw new DatabaseError(
        'SCHEMA_VERIFICATION_FAILED',
        'Database schema verification failed after migrations',
        { operation: 'initializeTestDatabase' }
      );
    }

    console.log('Test database initialized successfully');
  } catch (error: unknown) {
    if (!MIGRATIONS_AVAILABLE && !(error instanceof DatabaseError)) return;

    if (error instanceof DatabaseError) throw error;

    throw new DatabaseError('TEST_DB_INIT_FAILED', 'Failed to initialize test database', {
      operation: 'initializeTestDatabase',
      originalError: error instanceof Error ? error.message : String(error)
    });
  }
}
