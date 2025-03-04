// Export domain types
export type { User, NewUser, UserStatus } from './src/domains/users/models/user';

// Export repository interface and implementation
export type { IUserRepository } from './src/domains/users/interfaces/i-user-repository';
export { userQueries } from './src/domains/users/repository';

// Export validation utilities
export {
  validateUser,
  validateManyUsers,
  type ValidationOptions
} from './src/domains/users/models/user';

// Export database health check utility
export { checkDatabaseConnection } from './src/database';
