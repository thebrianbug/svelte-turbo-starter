import { log } from '../database/connection';

// Standardized error codes with descriptions
export const DatabaseErrorCode = {
  NOT_FOUND: 'NOT_FOUND',
  DUPLICATE_KEY: 'DUPLICATE_KEY',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CONNECTION_ERROR: 'CONNECTION_ERROR',
  QUERY_ERROR: 'QUERY_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;

export type DatabaseErrorCode = (typeof DatabaseErrorCode)[keyof typeof DatabaseErrorCode];

interface ErrorContext {
  operation?: string;
  params?: unknown;
  duration?: number;
  sql?: string;
}

// Custom error class for database operations with enhanced context
export class DatabaseError extends Error {
  constructor(
    message: string,
    public code: DatabaseErrorCode,
    public cause?: unknown,
    public context?: ErrorContext
  ) {
    super(message);
    this.name = 'DatabaseError';
  }

  static fromError(error: unknown, context?: ErrorContext): DatabaseError {
    if (error instanceof DatabaseError) {
      return new DatabaseError(error.message, error.code, error.cause, {
        ...error.context,
        ...context
      });
    }

    const message = error instanceof Error ? error.message : 'Unknown database error';

    // PostgreSQL error codes with improved handling
    if (error && typeof error === 'object' && 'code' in error) {
      const pgError = error as { code: string; detail?: string; constraint?: string };

      switch (pgError.code) {
        case '23505': // unique_violation
          return new DatabaseError(
            `Duplicate key violation: ${pgError.detail || message}`,
            DatabaseErrorCode.DUPLICATE_KEY,
            error,
            context
          );
        case '23503': // foreign_key_violation
          return new DatabaseError(
            `Foreign key violation: ${pgError.detail || message}`,
            DatabaseErrorCode.VALIDATION_ERROR,
            error,
            context
          );
        case '23502': // not_null_violation
          return new DatabaseError(
            `Not null violation: ${pgError.detail || message}`,
            DatabaseErrorCode.VALIDATION_ERROR,
            error,
            context
          );
        case '08000': // connection_exception
        case '08006': // connection_failure
        case '08001': // sqlclient_unable_to_establish_sqlconnection
        case '08004': // sqlserver_rejected_establishment_of_sqlconnection
          return new DatabaseError(
            `Connection error: ${message}`,
            DatabaseErrorCode.CONNECTION_ERROR,
            error,
            context
          );
        case '57014': // query_canceled
        case '57P01': // admin_shutdown
        case '57P02': // crash_shutdown
        case '57P03': // cannot_connect_now
          return new DatabaseError(
            `Query timeout or interruption: ${message}`,
            DatabaseErrorCode.TIMEOUT_ERROR,
            error,
            context
          );
        default:
          return new DatabaseError(
            `Query error: ${message}`,
            DatabaseErrorCode.QUERY_ERROR,
            error,
            context
          );
      }
    }

    return new DatabaseError(message, DatabaseErrorCode.UNKNOWN_ERROR, error, context);
  }
}

// Wrapper for safe database operations with timing and logging
export async function dbOperation<T>(
  operation: () => Promise<T>,
  context: { operation: string; params?: unknown } = { operation: 'unknown' }
): Promise<T> {
  const startTime = Date.now();

  try {
    const result = await operation();
    const duration = Date.now() - startTime;

    // Log successful operation
    log.info('Database operation completed', {
      operation: context.operation,
      duration,
      params: context.params
    });

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;

    // Create error context
    const errorContext: ErrorContext = {
      operation: context.operation,
      params: context.params,
      duration
    };

    // Convert to DatabaseError with context
    const dbError =
      error instanceof Error && error.name === 'ValidationError'
        ? new DatabaseError(error.message, DatabaseErrorCode.VALIDATION_ERROR, error, errorContext)
        : DatabaseError.fromError(error, errorContext);

    // Log error with context
    log.error('Database operation failed', dbError, {
      operation: context.operation,
      duration,
      params: context.params,
      errorCode: dbError.code
    });

    throw dbError;
  }
}
