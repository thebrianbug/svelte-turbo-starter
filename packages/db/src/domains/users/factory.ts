import { UserRepository } from './infrastructure/user-repository';
import type { IUserRepository } from './interfaces/i-user-repository';

export const createUserRepository = (): IUserRepository => {
  return new UserRepository();
};
