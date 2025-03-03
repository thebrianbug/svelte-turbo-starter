import { sql } from 'drizzle-orm';
import { db, client } from '../../../src/database';

// Define known tables in the system
export const TABLES = {
  USERS: 'users'
  // Add other tables as they are created
} as const;

// Allow string values for table names
export type TableName = string;

/**
 * Cleans a specific table while handling foreign key constraints
 */
export async function cleanTable(tableName: TableName): Promise<void> {
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
  relatedTables: TableName[]
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
 * Closes database connection during teardown
 */
export async function teardown(): Promise<void> {
  try {
    await client.end();
  } catch (error) {
    console.error('Database teardown failed:', error);
    throw error;
  }
}
