import { z } from 'zod';

// User status type
export type UserStatus = 'active' | 'inactive';

// Base user schema
export const userSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  status: z.enum(['active', 'inactive']).default('active')
});

// Database user type with all fields
export interface User {
  id: number;
  name: string;
  email: string;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Type for creating a new user
export type NewUser = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;

// Type for validated user data
export type ValidatedUser = z.infer<typeof userSchema>;

// Validation options
export interface ValidationOptions {
  requireAll?: boolean;
}

// Validation functions
export function validateUser(
  data: unknown,
  options: ValidationOptions = {}
): Partial<ValidatedUser> {
  const schema = options.requireAll ? userSchema : userSchema.partial();
  return schema.parse(data);
}

export function validateManyUsers(
  data: unknown[],
  options: ValidationOptions = {}
): Partial<ValidatedUser>[] {
  return data.map((item) => validateUser(item, options));
}
