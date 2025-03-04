import { userRepository } from '@repo/db';
import { UserService } from './src/domains/users/user-service';

// Pre-built service instance using the pre-built repository
export const userService = new UserService(userRepository);

// Also export the class for testing purposes
export { UserService };
