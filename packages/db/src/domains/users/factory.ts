import { UserRepository } from './infrastructure/user-repository';
import type { IUserRepository } from './interfaces/i-user-repository';
import type { TransactionType } from '../../infrastructure/base-repository';

import { getConnection } from '../../database';

/**
 * Factory function for creating UserRepository instances.
 *
 * Usage patterns:
 * 1. Direct instantiation for simple queries:
 *    const repo = createUserRepository();
 *
 * 2. With custom DB connection for transaction management:
 *    const repo = createUserRepository(customDbConnection);
 *
 * 3. For dependency injection in services:
 *    constructor(repo: IUserRepository = createUserRepository()) {}
 *
 * Note: Repository instances are designed to be short-lived and should
 * not be reused across multiple requests/operations.
 */
export const createUserRepository = (
  context?: ReturnType<typeof getConnection> | TransactionType
): IUserRepository => {
  // Check if the provided context is a transaction or a full connection
  if (context && 'query' in context && typeof context.query === 'function') {
    // It looks like a TransactionType (duck typing)
    return new UserRepository(undefined, context as TransactionType);
  }
  // Otherwise, assume it's a full connection object or undefined
  return new UserRepository(context as ReturnType<typeof getConnection> | undefined);
};
