import { describe, it, expect } from 'vitest';

import * as dbExports from './index';

describe('db package exports', () => {
  it('should export database utilities', () => {
    expect(dbExports.checkDatabaseConnection).toBeDefined();
  });

  it('should export all user domain exports', () => {
    // Schema & Types
    expect(dbExports.users).toBeDefined();
    expect(dbExports.userStatusEnum).toBeDefined();

    // Repository
    expect(dbExports.UserRepository).toBeDefined();
    expect(typeof dbExports.UserRepository).toBe('function'); // Should be a class

    // Validation
    expect(dbExports.newUserSchema).toBeDefined();
    expect(dbExports.updateUserSchema).toBeDefined();
    expect(dbExports.validateNewUser).toBeDefined();
    expect(dbExports.validateUpdateUser).toBeDefined();
    expect(dbExports.validateManyNewUsers).toBeDefined();
  });
});
