import { createUserRepository } from '@repo/db';
import { UserService } from '../../../src/domains/users/user-service';

/**
 * Creates a real UserService instance with real repositories
 * for integration testing
 */
export function createTestUserService(): UserService {
  const userRepository = createUserRepository();
  return new UserService(userRepository);
}
