// Export core database connection and schema
export * from './src/database';

// Export infrastructure types
export { type DatabaseType, type TransactionType } from './src/infrastructure/base-repository';

// Export domain-specific modules (e.g., repositories, models)
export * from './src/domains/users';

// Repository factories
export { createUserRepository } from './src/domains/users';

// Test utilities - only imported by BLL integration tests
export * as TestUtils from './tests';
