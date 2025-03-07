import { z } from 'zod';

export type UserStatus = 'active' | 'inactive';

export interface User {
  id: number;
  name: string;
  email: string;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type NewUser = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;

type NewUserInput = {
  name: string;
  email: string;
  status?: UserStatus;
};

export const newUserSchema = z.preprocess(
  (data): NewUserInput => {
    if (typeof data === 'object' && data !== null) {
      const input = data as Partial<NewUserInput>;
      return {
        ...input,
        status: input.status ?? 'active'
      } as NewUserInput;
    }
    return data as NewUserInput;
  },
  z.object({
    name: z.string().min(1).max(100),
    email: z.string().email(),
    status: z.enum(['active', 'inactive'])
  })
) as z.ZodType<NewUser>;

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  status: z.enum(['active', 'inactive']).optional()
});

export type ValidatedNewUser = z.infer<typeof newUserSchema>;

export type ValidatedUpdateUser = z.infer<typeof updateUserSchema>;

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
