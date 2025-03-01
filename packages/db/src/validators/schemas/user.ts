import { z } from 'zod';

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
  const schema = options.requireAll ? userSchema : userSchema.partial();
  return schema.parse(data);
};

export const validateManyUsers = (
  users: Partial<UserValidation>[],
  options: { requireAll?: boolean } = {}
): Partial<UserValidation>[] => {
  const schema = options.requireAll ? userSchema.array() : userSchema.partial().array();
  return schema.parse(users);
};
