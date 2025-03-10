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

    // Repository factory
    expect(dbExports.createUserRepository).toBeDefined();
    expect(typeof dbExports.createUserRepository).toBe('function');

    // Validation
    expect(dbExports.newUserSchema).toBeDefined();
    expect(dbExports.updateUserSchema).toBeDefined();
    expect(dbExports.validateNewUser).toBeDefined();
    expect(dbExports.validateUpdateUser).toBeDefined();
    expect(dbExports.validateManyNewUsers).toBeDefined();
  });

  it('should create a working user repository instance', () => {
    const userRepository = dbExports.createUserRepository();
    expect(userRepository).toBeDefined();
    expect(typeof userRepository.create).toBe('function');
    expect(typeof userRepository.findById).toBe('function');
    expect(typeof userRepository.findByEmail).toBe('function');
    expect(typeof userRepository.findActive).toBe('function');
    expect(typeof userRepository.findAll).toBe('function');
  });
});
