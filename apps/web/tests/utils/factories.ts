import type { TestTransactionContext } from './database';
// Use the main package entry point for imports
import { UserRepository, type NewUser } from '@repo/db';

/**
 * Creates data factories bound to a specific database transaction.
 * These factories simplify creating consistent test data within isolated transactions.
 *
 * @param tx The database transaction context.
 * @returns An object containing various entity factories.
 */
export function createTestDataFactories(tx: TestTransactionContext) {
  // Instantiate the repository directly with the transaction context
  const userRepo = new UserRepository(undefined, tx);

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
        // Generate a unique email for each test user to avoid collisions
        const defaultEmail = `testuser-${Date.now()}@example.com`;

        const userData: NewUser = {
          email: defaultEmail,
          name: 'Test User',
          status: 'active',
          // Merge overrides, allowing tests to specify particular fields
          ...overrides
        };

        // The repository's create method handles validation internally
        return userRepo.create(userData);
      }
      // Add other user-related factory methods if needed (e.g., createAdminUser)
    }
    // Add factories for other entities (e.g., products, orders) as the application grows
    /*
    products: {
      create: async (overrides = {}) => { ... }
    }
    */
  };
}
