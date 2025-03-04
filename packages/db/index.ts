// Database types and schema
export type { User, NewUser, UserStatus } from './src/domains/users/schema';
export { users, userStatusEnum } from './src/domains/users/schema';

// Repository exports
export type { IUserRepository } from './src/domains/users/interfaces/i-user-repository';
export { userQueries as userRepository } from './src/domains/users/repository';

// Validation utilities
export {
  validateNewUser,
  validateUpdateUser,
  validateManyNewUsers,
  newUserSchema,
  updateUserSchema,
  type ValidatedNewUser,
  type ValidatedUpdateUser
} from './src/domains/users/models/user';

// Database utilities
export { checkDatabaseConnection } from './src/database';
