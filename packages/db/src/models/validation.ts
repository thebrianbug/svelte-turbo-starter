import { DatabaseError, DatabaseErrorCode } from '../config/operations';
import type { UserStatus } from './schema';

export class ValidationError extends DatabaseError {
  constructor(message: string) {
    super(message, DatabaseErrorCode.VALIDATION_ERROR);
  }
}

export const userValidation = {
  email: (email: string): void => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError('Invalid email format');
    }
  },

  name: (name: string): void => {
    if (name.length < 1 || name.length > 100) {
      throw new ValidationError('Name must be between 1 and 100 characters');
    }
  },

  status: (status: unknown): status is UserStatus => {
    if (typeof status !== 'string' || (status !== 'active' && status !== 'inactive')) {
      throw new ValidationError('Status must be either "active" or "inactive"');
    }
    return true;
  }
};

export const userTransformation = {
  email: (email: string): string => {
    return email.trim().toLowerCase();
  },

  name: (name: string): string => {
    return name.trim().replace(/\s+/g, ' ');
  }
};
