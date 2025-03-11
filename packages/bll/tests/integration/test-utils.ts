import { executeTestInTransaction, createTransactionTestContext } from '@repo/db/tests';
import type { DatabaseType, TransactionType } from '@repo/db/src/infrastructure/base-repository';
import { getConnection } from '@repo/db/src/database';
import type { ServiceDependencies } from '../../src/infrastructure/types';

/**
 * Service test context that provides access to repositories and services
 * Following DDD principles:
 * 1. Uses transaction-based repositories
 * 2. Services created through factory functions
 * 3. Proper repository injection
 * 4. Test isolation through rollbacks
 */
export interface ServiceTestContext {
  deps: ServiceDependencies;
  tx: TransactionType;
}

/**
 * Creates a test context with both repositories and services
 * Services are created with transaction-based repositories for test isolation
 */
function createServiceTestContext(tx: TransactionType): ServiceTestContext {
  // Get repositories from base test context
  const baseContext = createTransactionTestContext(tx);

  // Create service dependencies with transaction-based repositories
  const deps: ServiceDependencies = {
    repositories: baseContext.repositories
  };

  return { deps, tx };
}

/**
 * Executes a service test within a transaction
 * Provides automatic rollback for test isolation
 * 
 * @param testFn Test function that receives the service test context
 * @param db Optional database connection (defaults to shared connection)
 */
export async function executeServiceTest<T>(
  testFn: (context: ServiceTestContext) => Promise<T>,
  db: DatabaseType = getConnection().db
): Promise<T> {
  return executeTestInTransaction(async (tx) => {
    const context = createServiceTestContext(tx);
    return testFn(context);
  }, db);
}

/**
 * Helper function to run a test with a specific service
 * Useful when only testing a single service in isolation
 * 
 * @param testFn Test function that receives a service instance
 * @param serviceGetter Function to get service from context
 * @param db Optional database connection
 */
export async function withServiceTest<S>(
  testFn: (service: S) => Promise<void>,
  serviceGetter: (context: ServiceTestContext) => S,
  db: DatabaseType = getConnection().db
): Promise<void> {
  await executeServiceTest(async (context) => {
    const service = serviceGetter(context);
    await testFn(service);
  }, db);
}
