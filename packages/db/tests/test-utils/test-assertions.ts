import { expect } from 'vitest';
import { DatabaseError } from '@repo/shared';

/**
 * Error assertion utilities for consistent test error handling
 *
 * These utilities help ensure consistent error testing patterns
 * across all database integration tests.
 */
export const ErrorAssertions = {
  /**
   * Asserts that an error is a DatabaseError with the expected properties
   */
  isDatabaseError(
    error: unknown,
    expectedCode: string,
    expectedMetadata?: Record<string, unknown>
  ): void {
    expect(error).toBeInstanceOf(DatabaseError);
    const dbError = error as DatabaseError;
    expect(dbError.code).toBe(expectedCode);

    if (expectedMetadata) {
      // Safely check metadata properties using Object.entries
      Object.entries(expectedMetadata).forEach(([key, value]) => {
        // Using a type assertion to avoid dynamic property access lint errors
        const metadataValue = dbError.metadata
          ? dbError.metadata[key as keyof typeof dbError.metadata]
          : undefined;
        expect(metadataValue).toBe(value);
      });
    }
  },

  /**
   * Asserts that the operation throws a NOT_FOUND error
   */
  async assertNotFound(operation: () => Promise<unknown>): Promise<void> {
    const error = await operation().catch((e) => e);
    ErrorAssertions.isDatabaseError(error, 'NOT_FOUND');
  },

  /**
   * Asserts that the operation throws a UNIQUE_VIOLATION error
   */
  async assertUniqueViolation(operation: () => Promise<unknown>): Promise<void> {
    const error = await operation().catch((e) => e);
    ErrorAssertions.isDatabaseError(error, 'UNIQUE_VIOLATION');
  },

  /**
   * Asserts that the operation throws a VALIDATION_FAILED error
   */
  async assertValidationFailed(operation: () => Promise<unknown>, field?: string): Promise<void> {
    const error = await operation().catch((e) => e);
    ErrorAssertions.isDatabaseError(error, 'VALIDATION_FAILED');
    if (field) {
      expect((error as DatabaseError).metadata?.field).toBe(field);
    }
  }
};
