import { eq, and, sql } from 'drizzle-orm';
import { users, type User, type NewUser, type UserStatus } from './schema';
import { db } from '../database/connection';
import { dbOperation } from '../config';
import { userValidation, userTransformation } from './validation';
import { DatabaseError, DatabaseErrorCode } from '../config/operations';

export const userQueries = {
  findById: async (id: number): Promise<User | undefined> => {
    return dbOperation(async () => {
      const result = await db.select().from(users).where(eq(users.id, id));
      return result[0];
    });
  },

  findByEmail: async (email: string): Promise<User | undefined> => {
    return dbOperation(async () => {
      const normalizedEmail = userTransformation.email(email);
      const result = await db.select().from(users).where(eq(users.email, normalizedEmail));
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
      // Validate required fields
      if (!newUser.email || !newUser.name || !newUser.status) {
        throw new DatabaseError('Missing required fields', DatabaseErrorCode.VALIDATION_ERROR);
      }

      // Validate and transform input
      userValidation.email(newUser.email);
      userValidation.name(newUser.name);
      if (!userValidation.status(newUser.status)) {
        throw new DatabaseError('Invalid status', DatabaseErrorCode.VALIDATION_ERROR);
      }

      const transformedUser = {
        ...newUser,
        email: userTransformation.email(newUser.email),
        name: userTransformation.name(newUser.name)
      };

      const result = await db.insert(users).values(transformedUser).returning();
      return result[0];
    });
  },

  createMany: async (newUsers: NewUser[]): Promise<User[]> => {
    return dbOperation(async () => {
      // Validate and transform all users first
      const transformedUsers = newUsers.map(user => {
        if (!user.email || !user.name || !user.status) {
          throw new DatabaseError('Missing required fields', DatabaseErrorCode.VALIDATION_ERROR);
        }

        userValidation.email(user.email);
        userValidation.name(user.name);
        if (!userValidation.status(user.status)) {
          throw new DatabaseError('Invalid status', DatabaseErrorCode.VALIDATION_ERROR);
        }

        return {
          ...user,
          email: userTransformation.email(user.email),
          name: userTransformation.name(user.name)
        };
      });

      const result = await db.insert(users).values(transformedUsers).returning();
      return result;
    });
  },

  update: async (id: number, userData: Partial<NewUser>): Promise<User | undefined> => {
    return dbOperation(async () => {
      const transformedData: Partial<NewUser> = { ...userData };

      if (userData.email) {
        userValidation.email(userData.email);
        transformedData.email = userTransformation.email(userData.email);
      }

      if (userData.name) {
        userValidation.name(userData.name);
        transformedData.name = userTransformation.name(userData.name);
      }

      if (userData.status && !userValidation.status(userData.status)) {
        throw new DatabaseError('Invalid status', DatabaseErrorCode.VALIDATION_ERROR);
      }

      const result = await db
        .update(users)
        .set({ ...transformedData, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();

      if (!result.length) {
        throw new DatabaseError('User not found', DatabaseErrorCode.NOT_FOUND);
      }

      return result[0];
    });
  },

  updateMany: async (filter: { status: UserStatus }, update: Partial<NewUser>): Promise<number> => {
    return dbOperation(async () => {
      const transformedData: Partial<NewUser> = { ...update };

      if (update.email) {
        userValidation.email(update.email);
        transformedData.email = userTransformation.email(update.email);
      }

      if (update.name) {
        userValidation.name(update.name);
        transformedData.name = userTransformation.name(update.name);
      }

      if (update.status && !userValidation.status(update.status)) {
        throw new DatabaseError('Invalid status', DatabaseErrorCode.VALIDATION_ERROR);
      }

      const result = await db
        .update(users)
        .set({ ...transformedData, updatedAt: new Date() })
        .where(eq(users.status, filter.status))
        .returning();

      return result.length;
    });
  },

  delete: async (id: number): Promise<boolean> => {
    return dbOperation(async () => {
      const result = await db
        .update(users)
        .set({ status: 'inactive', updatedAt: new Date() })
        .where(and(eq(users.id, id), eq(users.status, 'active')))
        .returning();

      if (!result.length) {
        throw new DatabaseError('User not found or already inactive', DatabaseErrorCode.NOT_FOUND);
      }

      return true;
    });
  },

  deleteMany: async (filter: { status: 'active' }): Promise<number> => {
    return dbOperation(async () => {
      const result = await db
        .update(users)
        .set({ status: 'inactive', updatedAt: new Date() })
        .where(eq(users.status, filter.status))
        .returning();

      return result.length;
    });
  },

  count: async (filter?: { status?: UserStatus }): Promise<number> => {
    return dbOperation(async () => {
      const query = db.select({ count: sql<number>`count(*)` }).from(users);
      
      if (filter?.status) {
        query.where(eq(users.status, filter.status));
      }

      const result = await query;
      return Number(result[0].count);
    });
  }
};
