import { createUserRepository } from '@repo/db';
import { UserService } from './user-service';
import type { ServiceDependencies } from '../../infrastructure/types';

/**
 * Factory function for creating UserService instances.
 *
 * Usage patterns:
 * 1. Standard service instantiation in API routes:
 *    const service = createUserService();
 *
 * 2. For integration tests with transaction repositories:
 *    const service = createUserService({ repositories: { users: txUserRepo } });
 *
 * 3. For unit testing with mocked dependencies:
 *    const mockRepo = mock<IUserRepository>();
 *    const service = createUserService({ repositories: { users: instance(mockRepo) } });
 *
 * Note: Services can be reused within the same request context
 * but should not be shared across different requests
 */
export const createUserService = (deps?: ServiceDependencies): UserService => {
  const userRepository = deps?.repositories?.users || createUserRepository();
  return new UserService(userRepository);
};
