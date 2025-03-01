// Standardized error codes
export const DatabaseErrorCode = {
  NOT_FOUND: 'NOT_FOUND',
  DUPLICATE_KEY: 'DUPLICATE_KEY',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CONNECTION_ERROR: 'CONNECTION_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;

export type DatabaseErrorCode = typeof DatabaseErrorCode[keyof typeof DatabaseErrorCode];

// Custom error class for database operations
export class DatabaseError extends Error {
  constructor(
    message: string,
    public code: DatabaseErrorCode,
    public cause?: unknown
  ) {
    super(message);
    this.name = 'DatabaseError';
  }

  static fromError(error: unknown): DatabaseError {
    if (error instanceof DatabaseError) {
      return error;
    }

    const message = error instanceof Error ? error.message : 'Unknown database error';
    
    // PostgreSQL error codes
    if (error && typeof error === 'object' && 'code' in error) {
      switch (error.code) {
        case '23505': // unique_violation
          return new DatabaseError(message, DatabaseErrorCode.DUPLICATE_KEY, error);
        case '23503': // foreign_key_violation
        case '23502': // not_null_violation
          return new DatabaseError(message, DatabaseErrorCode.VALIDATION_ERROR, error);
        case '08000': // connection_exception
        case '08006': // connection_failure
          return new DatabaseError(message, DatabaseErrorCode.CONNECTION_ERROR, error);
      }
    }

    return new DatabaseError(message, DatabaseErrorCode.UNKNOWN_ERROR, error);
  }
}

// Wrapper for safe database operations
export async function dbOperation<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw DatabaseError.fromError(error);
  }
}
