import { createUserRepository } from '@repo/db';
import { UserService } from '../../../src/domains/users/user-service';
import { getConnection } from '@repo/db/src/database';

/**
 * Creates a real UserService instance with real repositories
 * for integration testing. Uses the same database connection
 * as the test utilities to ensure proper table cleanup.
 */
export function createTestUserService(): UserService {
  // Get the shared database connection that's also used by test utilities
  const dbConnection = getConnection();
  const userRepository = createUserRepository(dbConnection);
  return new UserService(userRepository);
}
