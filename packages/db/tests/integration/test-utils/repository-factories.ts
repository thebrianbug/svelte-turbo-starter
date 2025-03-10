import { getConnection } from '../../../src/database';
import { createUserRepository } from '../../../src/domains/users';
import type { IUserRepository } from '../../../src/domains/users';

/**
 * Repository factory for integration tests
 *
 * This module centralizes the creation of test repositories and follows
 * the architectural patterns of the codebase:
 * - Factory Pattern for Repository Creation
 * - Proper layer separation
 * - Consistent test setup
 *
 * As the application grows, this file will be extended with:
 * - Additional repository factories
 * - Test-specific repository extensions
 * - Mock repositories for specific test scenarios
 */

/**
 * Creates a test user repository with the test database connection
 */
export function createTestUserRepository(
  connection: ReturnType<typeof getConnection> = getConnection()
): IUserRepository {
  return createUserRepository(connection);
}
