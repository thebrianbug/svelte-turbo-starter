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
    expect(dbExports.userRepository).toBeDefined();

    // Validation
    expect(dbExports.userSchema).toBeDefined();
    expect(dbExports.validateUser).toBeDefined();
    expect(dbExports.validateManyUsers).toBeDefined();
  });
});
