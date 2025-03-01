import { DatabaseError, DatabaseErrorCode } from '../config/operations';
import { type UserStatus } from '../../schema';

export class ValidationError extends DatabaseError {
  constructor(message: string) {
    super(message, DatabaseErrorCode.VALIDATION_ERROR);
  }
}

interface FieldValidator<T> {
  validate: (value: unknown) => void;
  transform?: (value: T) => T;
  required?: boolean;
}

export class Validator<T extends Record<string, any>> {
  private validators: { [K in keyof T]?: FieldValidator<T[K]> };

  constructor(validators: { [K in keyof T]?: FieldValidator<T[K]> }) {
    this.validators = validators;
  }

  validate(data: Partial<T>, options: { requireAll?: boolean } = {}): Partial<T> {
    try {
      // Create type-safe result object
      const result = {} as Partial<T>;
      
      // Check required fields only when creating new records
      if (options.requireAll) {
        for (const [field, validator] of Object.entries(this.validators)) {
          const key = field as keyof T;
          if (validator?.required && !(key in data)) {
            throw new ValidationError(`Missing required field: ${field}`);
          }
        }
      }

      // Validate and transform fields
      for (const [field, value] of Object.entries(data)) {
        const key = field as keyof T;
        const validator = this.validators[key];
        
        if (validator) {
          if (value !== undefined) {
            validator.validate(value);
            result[key] = validator.transform ? validator.transform(value as any) : value;
          }
        } else {
          // Pass through fields without validators
          result[key] = value as T[keyof T];
        }
      }

      return result;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Validation error', DatabaseErrorCode.VALIDATION_ERROR);
    }
  }

  validateMany(dataArray: Partial<T>[], options: { requireAll?: boolean } = {}): Partial<T>[] {
    return dataArray.map(data => this.validate(data, options));
  }
}

// Email validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const validateEmail = (email: unknown): void => {
  if (typeof email !== 'string') {
    throw new ValidationError('Email must be a string');
  }
  const trimmedEmail = email.trim();
  if (!emailRegex.test(trimmedEmail)) {
    throw new ValidationError('Invalid email format');
  }
};

// Name validation
const validateName = (name: unknown): void => {
  if (typeof name !== 'string' || name.length < 1 || name.length > 100) {
    throw new ValidationError('Name must be between 1 and 100 characters');
  }
};

// Status validation
const validateStatus = (status: unknown): status is UserStatus => {
  if (typeof status !== 'string' || (status !== 'active' && status !== 'inactive')) {
    throw new ValidationError('Status must be either "active" or "inactive"');
  }
  return true;
};

// Create user validator instance
export const userValidator = new Validator({
  email: {
    validate: validateEmail,
    transform: (email: string) => email.trim().toLowerCase(),
    required: true
  },
  name: {
    validate: validateName,
    transform: (name: string) => name.trim().replace(/\s+/g, ' '),
    required: true
  },
  status: {
    validate: validateStatus,
    required: true
  }
});
