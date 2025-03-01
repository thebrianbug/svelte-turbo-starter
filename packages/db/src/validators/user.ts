import { z } from 'zod';

export const userSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  status: z.enum(['active', 'inactive']).default('active')
});

export type UserSchema = typeof userSchema;
export type User = z.infer<typeof userSchema>;

interface ValidationOptions {
  requireAll?: boolean;
}

export function validateUser(data: unknown, options: ValidationOptions = {}): Partial<User> {
  const schema = options.requireAll ? userSchema : userSchema.partial();
  return schema.parse(data);
}

export function validateManyUsers(
  data: unknown[],
  options: ValidationOptions = {}
): Partial<User>[] {
  return data.map((item) => validateUser(item, options));
}
