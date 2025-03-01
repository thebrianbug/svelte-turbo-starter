import { describe, it, expect } from 'vitest';
import { userSchema, validateUser, validateManyUsers } from './user';
import type { UserStatus } from '../../schema';

describe('Zod User Validator', () => {
  it('should validate and transform valid user data', () => {
    const result = validateUser({
      name: '  John   Doe  ',
      email: '  USER@EXAMPLE.COM  ',
      status: 'active' as UserStatus
    });

    expect(result).toEqual({
      name: 'John Doe',
      email: 'user@example.com',
      status: 'active'
    });
  });

  it('should validate email format', () => {
    expect(() =>
      validateUser({
        name: 'John Doe',
        email: 'invalid-email',
        status: 'active' as UserStatus
      })
    ).toThrow('Invalid email format');
  });

  it('should validate name length', () => {
    expect(() =>
      validateUser({
        name: '',
        email: 'test@example.com',
        status: 'active' as UserStatus
      })
    ).toThrow('Name must be between 1 and 100 characters');

    expect(() =>
      validateUser({
        name: 'a'.repeat(101),
        email: 'test@example.com',
        status: 'active' as UserStatus
      })
    ).toThrow('Name must be between 1 and 100 characters');
  });

  it('should validate status values', () => {
    expect(() =>
      validateUser({
        name: 'John Doe',
        email: 'test@example.com',
        status: 'invalid' as UserStatus
      })
    ).toThrow('Status must be either "active" or "inactive"');
  });

  it('should handle partial updates', () => {
    const result = userSchema.partial().parse({
      name: '  John   Doe  '
    });

    expect(result).toEqual({
      name: 'John Doe'
    });
  });

  it('should validate multiple users', () => {
    const users = [
      {
        name: '  User   One  ',
        email: '  USER1@EXAMPLE.COM  ',
        status: 'active' as UserStatus
      },
      {
        name: '  User   Two  ',
        email: '  USER2@EXAMPLE.COM  ',
        status: 'inactive' as UserStatus
      }
    ];

    const results = validateManyUsers(users);
    expect(results).toEqual([
      {
        name: 'User One',
        email: 'user1@example.com',
        status: 'active'
      },
      {
        name: 'User Two',
        email: 'user2@example.com',
        status: 'inactive'
      }
    ]);
  });

  it('should throw error for invalid data in bulk validation', () => {
    const users = [
      {
        name: 'User One',
        email: 'user1@example.com',
        status: 'active' as UserStatus
      },
      {
        name: 'User Two',
        email: 'invalid-email',
        status: 'active' as UserStatus
      }
    ];

    expect(() => validateManyUsers(users)).toThrow('Invalid email format');
  });
});
