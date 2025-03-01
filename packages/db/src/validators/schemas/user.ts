import { z } from 'zod';
import type { UserStatus } from '../../schema';
import { ValidationError } from '../base';

const NAME_LENGTH_MESSAGE = 'Name must be between 1 and 100 characters';

export const userSchema = z.object({
  name: z
    .string()
    .min(1, { message: NAME_LENGTH_MESSAGE })
    .max(100, { message: NAME_LENGTH_MESSAGE })
    .transform((str) => str.trim().replace(/\s+/g, ' ')),
  email: z
    .string()
    .transform((str) => str.trim().toLowerCase())
    .pipe(z.string().email({ message: 'Invalid email format' })),
  status: z.enum(['active', 'inactive'] as const, {
    errorMap: () => ({ message: 'Status must be either "active" or "inactive"' })
  })
});

export type UserValidation = z.infer<typeof userSchema>;

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
  const schema = options.requireAll ? userSchema.array() : userSchema.partial().array();
  try {
    return schema.parse(users);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(error.errors[0].message);
    }
    throw error;
  }
};
