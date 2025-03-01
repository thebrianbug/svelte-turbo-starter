import { describe, it, expect } from 'vitest';
import { Validator, ValidationError, userValidator } from './validation';
import type { UserStatus } from './schema';

describe('Validator', () => {
  describe('Generic Validator Class', () => {
    interface TestType {
      field1: string;
      field2: number;
      field3?: boolean;
    }

    const testValidator = new Validator<TestType>({
      field1: {
        validate: (value: unknown) => {
          if (typeof value !== 'string') {
            throw new ValidationError('field1 must be a string');
          }
        },
        transform: (value: string) => value.toUpperCase(),
        required: true
      },
      field2: {
        validate: (value: unknown) => {
          if (typeof value !== 'number' || value < 0) {
            throw new ValidationError('field2 must be a positive number');
          }
        },
        required: true
      }
    });

    it('should validate and transform valid data', () => {
      const result = testValidator.validate({
        field1: 'test',
        field2: 42
      });

      expect(result).toEqual({
        field1: 'TEST',
        field2: 42
      });
    });

    it('should throw error for missing required fields', () => {
      expect(() => testValidator.validate({
        field1: 'test'
      })).toThrow('Missing required field: field2');
    });

    it('should allow optional fields', () => {
      const result = testValidator.validate({
        field1: 'test',
        field2: 42,
        field3: true
      });

      expect(result).toEqual({
        field1: 'TEST',
        field2: 42,
        field3: true
      });
    });

    it('should validate multiple items', () => {
      const items = [
        { field1: 'test1', field2: 1 },
        { field1: 'test2', field2: 2 }
      ];

      const results = testValidator.validateMany(items);
      expect(results).toEqual([
        { field1: 'TEST1', field2: 1 },
        { field1: 'TEST2', field2: 2 }
      ]);
    });

    it('should throw error for invalid data', () => {
      expect(() => testValidator.validate({
        field1: 'test',
        field2: -1
      })).toThrow('field2 must be a positive number');
    });
  });

  describe('User Validator', () => {
    it('should validate and transform valid user data', () => {
      const result = userValidator.validate({
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
      expect(() => userValidator.validate({
        name: 'John Doe',
        email: 'invalid-email',
        status: 'active' as UserStatus
      })).toThrow('Invalid email format');
    });

    it('should validate name length', () => {
      expect(() => userValidator.validate({
        name: '',
        email: 'test@example.com',
        status: 'active' as UserStatus
      })).toThrow('Name must be between 1 and 100 characters');

      expect(() => userValidator.validate({
        name: 'a'.repeat(101),
        email: 'test@example.com',
        status: 'active' as UserStatus
      })).toThrow('Name must be between 1 and 100 characters');
    });

    it('should validate status values', () => {
      expect(() => userValidator.validate({
        name: 'John Doe',
        email: 'test@example.com',
        status: 'invalid' as UserStatus
      })).toThrow('Status must be either "active" or "inactive"');
    });

    it('should handle partial updates', () => {
      const result = userValidator.validate({
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

      const results = userValidator.validateMany(users);
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

      expect(() => userValidator.validateMany(users))
        .toThrow('Invalid email format');
    });
  });
});
