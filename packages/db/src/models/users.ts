import { eq } from 'drizzle-orm';
import { users, type User, type NewUser } from './schema';
import { db } from '../database/connection';
import { dbOperation } from '../utils/db-operation';

export const userQueries = {
  // Validation methods
  validateEmail: (email: string): void => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }
  },

  validateName: (name: string): void => {
    if (name.length < 1 || name.length > 100) {
      throw new Error('Name must be between 1 and 100 characters');
    }
  },

  validateStatus: (status: string): void => {
    if (status !== 'active' && status !== 'inactive') {
      throw new Error('Invalid status');
    }
  },

  // Data transformation methods
  normalizeEmail: (email: string): string => {
    return email.trim().toLowerCase();
  },

  sanitizeName: (name: string): string => {
    return name.trim().replace(/\s+/g, ' ');
  },

  findById: async (id: number): Promise<User | undefined> => {
    return dbOperation(async () => {
      const result = await db.select().from(users).where(eq(users.id, id));
      return result[0];
    });
  },

  findByEmail: async (email: string): Promise<User | undefined> => {
    return dbOperation(async () => {
      const result = await db.select().from(users).where(eq(users.email, email));
      return result[0];
    });
  },

  findActive: async (): Promise<User[]> => {
    return dbOperation(async () => {
      return db.select().from(users).where(eq(users.status, 'active'));
    });
  },

  create: async (newUser: NewUser): Promise<User> => {
    return dbOperation(async () => {
      // Ensure required fields are present and validate
      if (typeof newUser.email !== 'string') throw new Error('Email is required');
      if (typeof newUser.name !== 'string') throw new Error('Name is required');
      if (typeof newUser.status !== 'string') throw new Error('Status is required');

      userQueries.validateEmail(newUser.email);
      userQueries.validateName(newUser.name);
      userQueries.validateStatus(newUser.status);

      // Transform data
      const transformedUser = {
        ...newUser,
        email: userQueries.normalizeEmail(newUser.email),
        name: userQueries.sanitizeName(newUser.name)
      };

      const result = await db.insert(users).values(transformedUser).returning();
      return result[0];
    });
  },

  update: async (id: number, userData: Partial<NewUser>): Promise<User | undefined> => {
    return dbOperation(async () => {
      // Validate and transform input fields if present
      const transformedData: Partial<NewUser> = { ...userData };

      if (typeof userData.email === 'string') {
        userQueries.validateEmail(userData.email);
        transformedData.email = userQueries.normalizeEmail(userData.email);
      }

      if (typeof userData.name === 'string') {
        userQueries.validateName(userData.name);
        transformedData.name = userQueries.sanitizeName(userData.name);
      }

      if (typeof userData.status === 'string') {
        userQueries.validateStatus(userData.status);
      }

      const result = await db
        .update(users)
        .set({ ...transformedData, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();
      return result[0];
    });
  },

  // Soft delete by updating status
  delete: async (id: number): Promise<boolean> => {
    return dbOperation(async () => {
      const result = await db
        .update(users)
        .set({ status: 'inactive', updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();
      return result.length > 0;
    });
  }
};
