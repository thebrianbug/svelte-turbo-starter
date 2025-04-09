import type { TransactionType } from '@repo/db';
import { createUserRepository, type NewUser } from '@repo/db';

/**
 * Creates data factories bound to a specific database transaction.
 * These factories simplify creating consistent test data within isolated transactions.
 *
 * @param tx The database transaction context provided by executeTestInTransaction or similar.
 * @returns An object containing various entity factories.
 */
export function createTestDataFactories(tx: TransactionType) {
  // Use the factory function from @repo/db, passing the transaction context
  const userRepo = createUserRepository(tx);

  return {
    /**
     * User entity factories.
     */
    users: {
      /**
       * Creates a new user with default values, allowing overrides.
       *
       * @param overrides Partial user data to override defaults.
       * @returns The created user entity.
       */
      create: async (overrides: Partial<NewUser> = {}) => {
        const defaultEmail = `testuser-${Date.now()}-${Math.random()}@example.com`;

        const userData: NewUser = {
          email: defaultEmail,
          name: 'Test User',
          status: 'active',
          ...overrides
        };

        return userRepo.create(userData);
      }
      // Add other user-related factory methods (e.g., createMany, createAdmin)
    }
    // Add factories for other entities as needed
    /*
    products: {
      create: async (overrides = {}) => {
        const productRepo = createProductRepository(tx); // Assuming a createProductRepository exists
        // ... implementation ...
      }
    }
    */
  };
}

// Optional: Type alias for the returned factories object
export type TestDataFactories = ReturnType<typeof createTestDataFactories>;
