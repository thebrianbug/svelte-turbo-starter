import { UserRepository } from './infrastructure/user-repository';
import type { IUserRepository } from './interfaces/i-user-repository';

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
  dbConnection?: ReturnType<typeof getConnection>
): IUserRepository => {
  return new UserRepository(dbConnection);
};
