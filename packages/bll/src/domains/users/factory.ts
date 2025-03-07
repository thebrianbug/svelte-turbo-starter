import { createUserRepository } from '@repo/db';
import { UserService } from './user-service';

/**
 * Factory function for creating UserService instances.
 *
 * Usage patterns:
 * 1. Standard service instantiation in API routes:
 *    const service = createUserService();
 *
 * 2. For unit testing with mocked dependencies:
 *    const mockRepo = createMockUserRepository();
 *    const service = new UserService(mockRepo);
 *
 * Note: Services can be reused within the same request context
 * but should not be shared across different requests
 */
export const createUserService = (): UserService => {
  const userRepository = createUserRepository();
  return new UserService(userRepository);
};
