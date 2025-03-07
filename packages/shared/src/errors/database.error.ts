import { PostgresError } from 'postgres';
import { DomainError } from './domain.error';

/**
 * Represents database-related errors in the system.
 * Wraps low-level database errors in a consistent domain format.
 */
export class DatabaseError extends DomainError {
  readonly code: string;

  constructor(code: string, message: string, metadata?: Record<string, unknown>) {
    super(message, metadata);
    this.code = code;
  }

  static from(error: unknown, operation: string): DatabaseError {
    if (error instanceof PostgresError) {
      if (error.code === '23505') {
        return new DatabaseError('UNIQUE_VIOLATION', 'Unique constraint violation', {
          postgresCode: error.code
        });
      }
    }

    return new DatabaseError(
      'OPERATION_FAILED',
      `Failed to ${operation}: ${error instanceof Error ? error.message : String(error)}`,
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}
