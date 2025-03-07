import { createUserRepository } from '@repo/db';
import { UserService } from './user-service';

export const createUserService = (): UserService => {
  const userRepository = createUserRepository();
  return new UserService(userRepository);
};
