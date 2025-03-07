import { z } from 'zod';
import { ValidationError } from '@repo/shared';

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
  try {
    return newUserSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('user', error.errors[0].message);
    }
    throw error;
  }
}

export function validateUpdateUser(data: unknown): ValidatedUpdateUser {
  try {
    const result = updateUserSchema.parse(data);

    // Ensure status is always set to a valid value if provided
    if (result.status === undefined) {
      delete result.status;
    }

    return result;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('user', error.errors[0].message);
    }
    throw error;
  }
}

export function validateManyNewUsers(data: unknown[]): ValidatedNewUser[] {
  try {
    return data.map(validateNewUser);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('user', error.errors[0].message);
    }
    throw error;
  }
}
