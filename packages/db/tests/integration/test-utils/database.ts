import { sql } from 'drizzle-orm';
import { getConnection } from '../../../src/database';
import type { DatabaseType } from '../../../src/infrastructure/base-repository';
import { createTestUserRepository } from './repository-factories';

// Define known tables in the system
export const TABLES = {
  USERS: 'users'
  // Add other tables as they are created
} as const;

export type TableName = (typeof TABLES)[keyof typeof TABLES];

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
 * Verifies that the database schema is properly initialized
 * This ensures tests run against the correct schema structure
 */
export async function verifyDatabaseSchema(db: DatabaseType): Promise<boolean> {
  try {
    // Check if required tables exist
    const tableChecks = Object.values(TABLES).map(async (tableName) => {
      const result = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${tableName}
        )
      `);
      return result[0]?.exists === true;
    });

    const results = await Promise.all(tableChecks);
    return results.every(Boolean);
  } catch (error) {
    console.error('Failed to verify database schema:', error);
    return false;
  }
}

/**
 * Creates a test context that uses the shared connection
 * and provides access to test repositories
 */
export function createTestContext() {
  const connection = getSharedConnection();

  // Verify schema exists (don't block, but log errors)
  verifyDatabaseSchema(connection.db).then((isValid) => {
    if (!isValid) {
      console.error('WARNING: Database schema verification failed. Tests may not run correctly.');
    }
    return isValid;
  });

  return {
    connection,
    db: connection.db,
    // Create test repositories following the factory pattern
    repositories: {
      users: createTestUserRepository(connection)
    },
    // No-op cleanup to maintain API compatibility
    // Real cleanup happens in afterAll hook
    async cleanup() {}
  };
}

/**
 * Cleans a specific table while handling foreign key constraints
 */
export async function cleanTable(
  tableName: TableName,
  db: DatabaseType = getSharedConnection().db
): Promise<void> {
  try {
    await db.transaction(async (tx) => {
      // Temporarily disable foreign key constraints
      await tx.execute(sql`SET CONSTRAINTS ALL DEFERRED`);
      await tx.execute(sql`TRUNCATE TABLE ${sql.identifier(tableName)} CASCADE`);
    });
  } catch (error) {
    console.error(`Failed to clean table ${tableName}:`, error);
    throw error;
  }
}

/**
 * Cleans multiple related tables in a single transaction
 */
export async function cleanRelatedTables(
  primaryTable: TableName,
  relatedTables: TableName[],
  db: DatabaseType = getSharedConnection().db
): Promise<void> {
  try {
    await db.transaction(async (tx) => {
      await tx.execute(sql`SET CONSTRAINTS ALL DEFERRED`);
      for (const table of [...relatedTables, primaryTable]) {
        await tx.execute(sql`TRUNCATE TABLE ${sql.identifier(table)} CASCADE`);
      }
    });
  } catch (error) {
    console.error(`Failed to clean related tables for ${primaryTable}:`, error);
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

// Error assertions have been moved to test-assertions.ts
export { ErrorAssertions } from './test-assertions';
