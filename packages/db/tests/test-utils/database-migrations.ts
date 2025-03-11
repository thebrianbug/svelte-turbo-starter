import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/postgres-js';
import { join } from 'path';
import { existsSync } from 'fs';
import { getSharedConnection } from './database';
import { DatabaseError } from '@repo/shared';
import * as schema from '../../src/domains/users/schema/schema';

// Schema objects for introspection
export const SCHEMA_OBJECTS = {
  USERS: schema.users
  // Add other schema objects as they are created
} as const;

export type SchemaObject = (typeof SCHEMA_OBJECTS)[keyof typeof SCHEMA_OBJECTS];

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

/**
 * Categorize schema validation errors into domain-specific types
 */
function categorizeSchemaError(error: unknown): {
  code: string;
  type: string;
  message: string;
} {
  const errorMessage =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  if (errorMessage.includes('schema')) {
    return {
      code: 'SCHEMA_VALIDATION_FAILED',
      type: 'schema_mismatch',
      message: 'Schema structure does not match expected definition'
    };
  }

  if (errorMessage.includes('permission') || errorMessage.includes('access')) {
    return {
      code: 'SCHEMA_ACCESS_DENIED',
      type: 'access_control',
      message: 'Insufficient permissions to validate schema'
    };
  }

  if (errorMessage.includes('connection') || errorMessage.includes('timeout')) {
    return {
      code: 'DATABASE_CONNECTIVITY_ERROR',
      type: 'infrastructure',
      message: 'Unable to connect to database for schema validation'
    };
  }

  return {
    code: 'SCHEMA_VALIDATION_ERROR',
    type: 'unknown',
    message: 'Unexpected error during schema validation'
  };
}

export async function verifyMigratedSchema(
  schemaObjects: SchemaObject[] = Object.values(SCHEMA_OBJECTS)
): Promise<boolean> {
  const connection = getSharedConnection();
  const db = connection.db;

  try {
    // Verify each schema object by attempting a simple query
    const schemaChecks = await Promise.all(
      schemaObjects.map(async (table) => {
        try {
          // Use Drizzle's type-safe query builder to verify table structure
          // Using limit(0) is more efficient as we only need to verify schema, not fetch data
          await db.select().from(table).limit(0);
          return { table: table.name, valid: true };
        } catch (error) {
          const errorInfo = categorizeSchemaError(error);

          const dbError = new DatabaseError(
            errorInfo.code,
            `Failed to validate ${table.name} schema: ${errorInfo.message}`,
            {
              operation: 'verifyMigratedSchema',
              domain: 'schema_management',
              entity: table.name,
              errorType: errorInfo.type,
              validationType: 'structure',
              originalError: error instanceof Error ? error.message : String(error)
            }
          );

          return {
            table: table.name,
            valid: false,
            error: dbError
          };
        }
      })
    );

    const failedTables = schemaChecks.filter((check) => !check.valid);
    if (failedTables.length > 0) {
      // Log detailed error information for debugging
      console.error(
        'Schema verification failed:',
        failedTables.map((t) => ({
          table: t.table,
          error: t.error instanceof DatabaseError ? t.error.message : String(t.error)
        }))
      );
      return false;
    }

    return true;
  } catch (error) {
    // Handle unexpected errors during verification process
    throw new DatabaseError(
      'SCHEMA_VERIFICATION_ERROR',
      'Unexpected error during schema verification process',
      {
        operation: 'verifyMigratedSchema',
        context: 'verification_process',
        originalError: error instanceof Error ? error.message : String(error)
      }
    );
  }
}

export async function initializeTestDatabase(): Promise<void> {
  try {
    await applyTestMigrations();
    const isValid = await verifyMigratedSchema(Object.values(SCHEMA_OBJECTS));

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
