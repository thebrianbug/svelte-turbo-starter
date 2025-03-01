import { ValidationError } from '../base';

export const validateString = (
  value: unknown,
  options: { minLength?: number; maxLength?: number; fieldName?: string } = {}
): void => {
  const { minLength = 1, maxLength = 100, fieldName = 'String' } = options;

  if (typeof value !== 'string') {
    throw new ValidationError(`${fieldName} must be a string`);
  }

  const trimmedLength = value.trim().length;
  if (trimmedLength < minLength || trimmedLength > maxLength) {
    throw new ValidationError(
      `${fieldName} must be between ${minLength} and ${maxLength} characters`
    );
  }
};

export const transformString = (value: string): string => {
  return value.trim().replace(/\s+/g, ' ');
};
