import type { TestTransactionContext } from './database';
// Use the main package entry point for imports from db
import { UserRepository, type NewUser, type TransactionType } from '@repo/db';

/**
 * Creates data factories bound to a specific database transaction.
 * These factories simplify creating consistent test data within isolated transactions.
 *
 * @param tx The database transaction context provided by executeTestInTransaction or similar.
 * @returns An object containing various entity factories.
 */
export function createTestDataFactories(tx: TestTransactionContext) {
  // Instantiate repositories directly with the transaction context
  // Pass undefined for the non-transactional DB connection as it's not needed here
  // Use type assertion for 'tx' to match the expected TransactionType
  const userRepo = new UserRepository(undefined, tx as unknown as TransactionType);

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
        const productRepo = new ProductRepository(undefined, tx);
        // ... implementation ...
      }
    }
    */
  };
}

// Optional: Type alias for the returned factories object
export type TestDataFactories = ReturnType<typeof createTestDataFactories>;
