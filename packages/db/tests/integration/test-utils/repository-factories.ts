import { getConnection } from '../../../src/database';
import { UserRepository } from '../../../src/domains/users/infrastructure/user-repository';
import type { IUserRepository } from '../../../src/domains/users';
import type { TransactionType } from '../../../src/infrastructure/base-repository';

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
  return new UserRepository(connection);
}

/**
 * Creates a test user repository that uses a transaction
 * This is used for transaction-based test isolation
 */
export function createTransactionUserRepository(tx: TransactionType): IUserRepository {
  // Create a repository that uses the transaction directly
  // We pass undefined as the connection and the transaction as the second parameter
  return new UserRepository(undefined, tx);
}
