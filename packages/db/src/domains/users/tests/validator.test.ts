import { describe, it, expect } from 'vitest';

import { userSchema } from '../validator';

describe('User Schema Validation', () => {
  const validUser = {
    name: 'Test User',
    email: 'test@example.com',
    status: 'active' as const
  };

  it('should validate a correct user object', () => {
    const result = userSchema.safeParse(validUser);
    expect(result.success).toBe(true);
  });

  it('should validate user with default status', () => {
    const userWithoutStatus = {
      name: 'Test User',
      email: 'test@example.com'
    };
    const result = userSchema.safeParse(userWithoutStatus);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('active');
    }
  });

  describe('Name Validation', () => {
    it('should reject empty name', () => {
      const result = userSchema.safeParse({
        ...validUser,
        name: ''
      });
      expect(result.success).toBe(false);
    });

    it('should reject too long name', () => {
      const result = userSchema.safeParse({
        ...validUser,
        name: 'a'.repeat(101)
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Email Validation', () => {
    it('should reject invalid email', () => {
      const result = userSchema.safeParse({
        ...validUser,
        email: 'invalid-email'
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Status Validation', () => {
    it('should reject invalid status', () => {
      const result = userSchema.safeParse({
        ...validUser,
        status: 'invalid' as 'active' | 'inactive'
      });
      expect(result.success).toBe(false);
    });

    it('should accept inactive status', () => {
      const result = userSchema.safeParse({
        ...validUser,
        status: 'inactive'
      });
      expect(result.success).toBe(true);
    });
  });
});
