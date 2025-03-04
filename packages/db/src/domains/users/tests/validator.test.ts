import { describe, it, expect } from 'vitest';
import {
  newUserSchema,
  updateUserSchema,
  validateNewUser,
  validateUpdateUser,
  type UserStatus
} from '../models/user';

describe('User Validation', () => {
  const validNewUser = {
    name: 'Test User',
    email: 'test@example.com',
    status: 'active' as const
  };

  describe('New User Validation', () => {
    it('should validate a correct new user object', () => {
      const result = newUserSchema.safeParse(validNewUser);
      expect(result.success).toBe(true);
    });

    it('should validate new user with default status', () => {
      const userWithoutStatus = {
        name: 'Test User',
        email: 'test@example.com'
      };
      const result = validateNewUser(userWithoutStatus);
      expect(result.status).toBe('active');
    });

    it('should reject empty name', () => {
      expect(() =>
        validateNewUser({
          ...validNewUser,
          name: ''
        })
      ).toThrow();
    });

    it('should reject too long name', () => {
      expect(() =>
        validateNewUser({
          ...validNewUser,
          name: 'a'.repeat(101)
        })
      ).toThrow();
    });

    it('should reject invalid email', () => {
      expect(() =>
        validateNewUser({
          ...validNewUser,
          email: 'invalid-email'
        })
      ).toThrow();
    });

    it('should reject invalid status', () => {
      expect(() =>
        validateNewUser({
          ...validNewUser,
          status: 'invalid' as UserStatus
        })
      ).toThrow();
    });
  });

  describe('Update User Validation', () => {
    it('should validate partial updates', () => {
      const result = updateUserSchema.safeParse({
        name: 'Updated Name'
      });
      expect(result.success).toBe(true);
    });

    it('should validate complete updates', () => {
      const result = validateUpdateUser(validNewUser);
      expect(result).toEqual(validNewUser);
    });

    it('should allow empty update', () => {
      const result = validateUpdateUser({});
      expect(result).toEqual({});
    });

    it('should reject invalid email in update', () => {
      expect(() =>
        validateUpdateUser({
          email: 'invalid-email'
        })
      ).toThrow();
    });

    it('should reject invalid status in update', () => {
      expect(() =>
        validateUpdateUser({
          status: 'invalid' as UserStatus
        })
      ).toThrow();
    });
  });
});
