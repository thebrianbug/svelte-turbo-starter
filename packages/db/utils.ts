// Custom error class for database operations
export class DatabaseError extends Error {
  constructor(
    message: string,
    public cause?: unknown,
    public code?: string
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

// Wrapper for safe database operations
export async function dbOperation<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw new DatabaseError(
      'Database operation failed',
      error,
      error instanceof Error ? error.message : undefined
    );
  }
}
