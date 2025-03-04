import { z } from 'zod';

// Base user schema for validation
export const userSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  status: z.enum(['active', 'inactive']).default('active')
});

// Type for validated user data
export type ValidatedUser = z.infer<typeof userSchema>;

// Validation options
export type ValidationOptions = {
  requireAll?: boolean;
};

// Validation functions
export function validateUser(
  data: unknown,
  options: ValidationOptions = {}
): Partial<ValidatedUser> {
  const schema = (options.requireAll ?? false) ? userSchema : userSchema.partial();
  const result = schema.parse(data);

  // Ensure status is always set to a valid value
  if (!result.status) {
    result.status = 'active';
  }

  return result;
}

export function validateManyUsers(
  data: unknown[],
  options: ValidationOptions = {}
): Partial<ValidatedUser>[] {
  return data.map((item) => validateUser(item, options));
}
