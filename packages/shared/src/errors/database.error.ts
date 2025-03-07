import { BaseError } from './base.error';

// Define a type for Postgres errors based on their structure
type PostgresError = {
  code: string;
  detail?: string;
  message: string;
  // Additional properties that might be present in Postgres errors
  constraint?: string;
  schema?: string;
  table?: string;
  column?: string;
};

/**
 * Common Postgres error codes we handle
 * @see https://www.postgresql.org/docs/current/errcodes-appendix.html
 */
enum PostgresErrorCode {
  UNIQUE_VIOLATION = '23505',
  NO_DATA = '02000',
  NO_DATA_FOUND = 'P0002'
}

/**
 * Represents database-related errors in the system.
 * Wraps low-level database errors in a consistent domain format.
 */
export class DatabaseError extends BaseError {
  constructor(code: string, message: string, metadata?: Record<string, unknown>) {
    super(code, message, metadata);
  }

  private static parseUniqueViolation(error: PostgresError): { field: string; value: string } {
    const detailMatch = error.detail?.match(/Key \((.+)\)=\((.+)\)/);
    const field = detailMatch?.[1] || 'unknown';
    const value = detailMatch?.[2] || 'unknown';
    return { field, value };
  }

  static from(entityType: string, error: unknown, operation: string): DatabaseError {
    if (error instanceof DatabaseError) {
      return new DatabaseError(error.code, error.message, {
        entityType,
        operation,
        ...error.metadata
      });
    }

    if (error && typeof error === 'object' && 'code' in error) {
      const pgError = error as PostgresError;
      switch (pgError.code) {
        case PostgresErrorCode.UNIQUE_VIOLATION: {
          const { field, value } = this.parseUniqueViolation(pgError);
          return new DatabaseError(
            'UNIQUE_VIOLATION',
            `Unique constraint violation in ${entityType}`,
            { entityType, field, value }
          );
        }
        case PostgresErrorCode.NO_DATA:
        case PostgresErrorCode.NO_DATA_FOUND:
          return new DatabaseError('NOT_FOUND', `Record not found in ${entityType}`, {
            entityType
          });
      }
    }

    // Default to generic database error for unhandled cases
    return new DatabaseError(
      'OPERATION_FAILED',
      `Database operation '${operation}' failed on ${entityType}`,
      { entityType, operation, error: error instanceof Error ? error.message : String(error) }
    );
  }
}
