// Database utilities
export { checkDatabaseConnection } from './src/database';

// Domain models
export * from './src/domains/users';

// Pre-built repository instance
import { UserRepository } from './src/domains/users';
export const userRepository = new UserRepository();
