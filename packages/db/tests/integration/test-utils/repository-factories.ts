import { getConnection } from '../../../src/database';
import { createUserRepository } from '../../../src/domains/users';
import type { IUserRepository } from '../../../src/domains/users';
import type { DatabaseType } from '../../../src/infrastructure/base-repository';

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

/**
 * Creates a test user repository that uses a transaction
 * This is used for transaction-based test isolation
 */
export function createTransactionUserRepository(
  tx: DatabaseType
): IUserRepository {
  // Create a repository that uses the transaction instead of the connection
  // Note: We're using a workaround to pass the transaction as the db property
  return createUserRepository({
    db: tx,
    // We only need to provide the db property for the transaction to work
    // The client property is needed by the type system but not used in tests
    client: {} as any
  });
}
