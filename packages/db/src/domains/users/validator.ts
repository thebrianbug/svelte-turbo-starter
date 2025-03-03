import { z } from 'zod';

export const userSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  status: z.enum(['active', 'inactive']).default('active')
});

export type UserSchema = typeof userSchema;
export type ValidatedUser = z.infer<typeof userSchema>;

export type ValidationOptions = {
  requireAll?: boolean;
};

export function validateUser(
  data: unknown,
  options: ValidationOptions = {}
): Partial<ValidatedUser> {
  const schema = (options.requireAll ?? false) ? userSchema : userSchema.partial();
  return schema.parse(data);
}

export function validateManyUsers(
  data: unknown[],
  options: ValidationOptions = {}
): Partial<ValidatedUser>[] {
  return data.map((item) => validateUser(item, options));
}
