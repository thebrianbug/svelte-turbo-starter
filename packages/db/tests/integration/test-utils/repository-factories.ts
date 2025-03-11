import { getConnection } from '../../../src/database';
import { UserRepository } from '../../../src/domains/users/infrastructure/user-repository';
import type { IUserRepository } from '../../../src/domains/users';
import type { TransactionType } from '../../../src/infrastructure/base-repository';

/**
 * Repository Factory Module for Integration Tests
 *
 * This module implements the Domain-Driven Design principles for repository creation
 * and management in integration tests. It provides factory methods for both standard
 * and transaction-based repository instances.
 *
 * DDD Principles Implemented:
 * 1. Bounded Contexts: Each domain has its own repository factories
 * 2. Aggregate Roots: Repositories manage complete aggregates
 * 3. Repository Pattern: Abstract persistence details behind interfaces
 * 4. Domain Events: Support for transaction-based event handling
 *
 * Architecture Patterns:
 * 1. Factory Pattern for Repository Creation
 * 2. Dependency Injection through constructor parameters
 * 3. Interface-based contracts (e.g., IUserRepository)
 * 4. Transaction propagation across repositories
 * 5. Test isolation through transaction boundaries
 *
 * Repository Factory Pattern:
 * Each domain implements two repository factory functions:
 *
 * 1. createTest[Domain]Repository:
 *    - Creates a repository with a new or provided connection
 *    - Used for tests that don't require transaction isolation
 *    - Returns the domain's repository interface type
 *
 * 2. createTransaction[Domain]Repository:
 *    - Creates a repository that uses a provided transaction
 *    - Used for test isolation through transaction rollback
 *    - Enables testing transaction flows across repositories
 *    - Returns the domain's repository interface type
 *
 * Implementation Rules:
 * 1. Return interface types, not concrete implementations
 * 2. Create transaction repos with (undefined, tx) parameters
 * 3. Follow consistent naming across all domains
 * 4. Maintain clear separation between domain sections
 */

/**
 * ==============================
 * USER DOMAIN REPOSITORIES
 * ==============================
 */

/**
 * Creates a test user repository with the test database connection
 * @param connection - Optional database connection (defaults to new connection)
 * @returns IUserRepository implementation
 */
export function createTestUserRepository(
  connection: ReturnType<typeof getConnection> = getConnection()
): IUserRepository {
  return new UserRepository(connection);
}

/**
 * Creates a test user repository that uses a transaction
 * @param tx - Transaction to use for all database operations
 * @returns IUserRepository implementation using the provided transaction
 */
export function createTransactionUserRepository(tx: TransactionType): IUserRepository {
  return new UserRepository(undefined, tx);
}

/**
 * ==============================
 * FUTURE DOMAIN REPOSITORIES
 * ==============================
 *
 * Template for adding new domain repositories:
 *
 * 1. Import statements:
 *    import { NewDomainRepository } from '../domains/newdomain/infrastructure/new-domain-repository';
 *    import type { INewDomainRepository } from '../domains/newdomain';
 *
 * 2. Standard repository factory:
 *    export function createTestNewDomainRepository(
 *      connection: ReturnType<typeof getConnection> = getConnection()
 *    ): INewDomainRepository {
 *      return new NewDomainRepository(connection);
 *    }
 *
 * 3. Transaction repository factory:
 *    export function createTransactionNewDomainRepository(
 *      tx: TransactionType
 *    ): INewDomainRepository {
 *      return new NewDomainRepository(undefined, tx);
 *    }
 *
 * When adding a new domain:
 * 1. Create a new section with domain-specific header
 * 2. Import required types and implementations
 * 3. Implement both factory functions
 * 4. Update TestContext and TransactionTestContext in database.ts
 */
