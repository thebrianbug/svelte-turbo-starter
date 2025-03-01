import { z } from 'zod';
import type { UserStatus } from '../../schema';

// Helper function to trim and normalize whitespace
const normalizeString = (str: string): string => str.trim().replace(/\s+/g, ' ');

// Helper function to normalize email
const normalizeEmail = (email: string): string => email.trim().toLowerCase();

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const userSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Name must be between 1 and 100 characters' })
    .max(100, { message: 'Name must be between 1 and 100 characters' })
    .transform(normalizeString),
  email: z
    .string()
    .refine((email) => emailRegex.test(email.trim()), {
      message: 'Invalid email format'
    })
    .transform(normalizeEmail),
  status: z.enum(['active', 'inactive'] as const, {
    errorMap: () => ({ message: 'Status must be either "active" or "inactive"' })
  })
});

export type UserValidation = z.infer<typeof userSchema>;

export const validateUser = (data: Partial<UserValidation>): UserValidation => {
  try {
    return userSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Get the first error message
      throw new Error(error.errors[0].message);
    }
    throw error;
  }
};

export const validateManyUsers = (users: Partial<UserValidation>[]): UserValidation[] => {
  return users.map((user) => validateUser(user));
};
