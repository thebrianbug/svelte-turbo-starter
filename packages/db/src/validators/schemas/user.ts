import { z } from 'zod';
import type { UserStatus } from '../../schema';

export const userSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Name must be between 1 and 100 characters' })
    .max(100, { message: 'Name must be between 1 and 100 characters' })
    .transform((str) => str.trim().replace(/\s+/g, ' ')),
  email: z
    .string()
    .transform((str: string) => str.trim())
    .pipe(z.string().email({ message: 'Invalid email format' }))
    .transform((str: string) => str.toLowerCase()),
  status: z.enum(['active', 'inactive'] as const, {
    errorMap: () => ({ message: 'Status must be either "active" or "inactive"' })
  })
});

export type UserValidation = z.infer<typeof userSchema>;

class ValidationError extends Error {
  code: string;
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
    this.code = 'VALIDATION_ERROR';
  }
}

export const validateUser = (
  data: Partial<UserValidation>,
  options: { requireAll?: boolean } = {}
): Partial<UserValidation> => {
  try {
    const schema = options.requireAll ? userSchema : userSchema.partial();
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(error.errors[0].message);
    }
    throw error;
  }
};

export const validateManyUsers = (
  users: Partial<UserValidation>[],
  options: { requireAll?: boolean } = {}
): Partial<UserValidation>[] => {
  return users.map((user) => validateUser(user, options));
};
