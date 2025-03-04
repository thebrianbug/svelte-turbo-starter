import { z } from 'zod';
import type { User, NewUser, UserStatus } from '../schema';

// Re-export the base types
export type { User, NewUser, UserStatus };

// Validation schema for new users
export const newUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  status: z.enum(['active', 'inactive']).default('active')
}) satisfies z.ZodType<NewUser>;

// Validation schema for updating users
export const updateUserSchema = newUserSchema.partial();

// Type for validated new user data
export type ValidatedNewUser = z.infer<typeof newUserSchema>;

// Type for validated update user data
export type ValidatedUpdateUser = z.infer<typeof updateUserSchema>;

// Validation functions
export function validateNewUser(data: unknown): ValidatedNewUser {
  return newUserSchema.parse(data);
}

export function validateUpdateUser(data: unknown): ValidatedUpdateUser {
  const result = updateUserSchema.parse(data);

  // Ensure status is always set to a valid value if provided
  if (result.status === undefined) {
    delete result.status;
  }

  return result;
}

export function validateManyNewUsers(data: unknown[]): ValidatedNewUser[] {
  return data.map(validateNewUser);
}
