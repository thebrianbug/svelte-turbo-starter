import { sql } from 'drizzle-orm';
import { getConnection } from '../../../src/database';
import type { DatabaseType } from '../../../src/infrastructure/base-repository';

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
 * Creates a test context that uses the shared connection
 */
export function createTestContext() {
  const connection = getSharedConnection();
  return {
    connection,
    db: connection.db,
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
