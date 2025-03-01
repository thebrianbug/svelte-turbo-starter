import { ValidationError } from '../base';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateEmail = (email: unknown): void => {
  if (typeof email !== 'string') {
    throw new ValidationError('Email must be a string');
  }
  const trimmedEmail = email.trim();
  if (!emailRegex.test(trimmedEmail)) {
    throw new ValidationError('Invalid email format');
  }
};

export const transformEmail = (email: string): string => {
  return email.trim().toLowerCase();
};
