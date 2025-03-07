import { UserRepository } from './infrastructure/user-repository';
import type { IUserRepository } from './interfaces/i-user-repository';

import { getConnection } from '../../database';

export const createUserRepository = (
  dbConnection?: ReturnType<typeof getConnection>
): IUserRepository => {
  return new UserRepository(dbConnection);
};
