import { eq, and, sql } from 'drizzle-orm';
import { users, type User, type NewUser, type UserStatus } from '../schema';
import { db } from '../database/connection';
import { dbOperation } from '../config';
import { validateUser, validateManyUsers } from '../validators/schemas/user';
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
      const normalizedEmail = email.trim().toLowerCase();
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
      const validatedUser = validateUser(newUser, { requireAll: true }) as Required<NewUser>;
      const result = await db.insert(users).values(validatedUser).returning();
      return result[0];
    });
  },

  createMany: async (newUsers: NewUser[]): Promise<User[]> => {
    return dbOperation(async () => {
      if (newUsers.length === 0) {
        return [];
      }

      const validatedUsers = validateManyUsers(newUsers, {
        requireAll: true
      }) as Required<NewUser>[];
      const result = await db.insert(users).values(validatedUsers).returning();
      return result;
    });
  },

  update: async (id: number, userData: Partial<NewUser>): Promise<User | undefined> => {
    return dbOperation(async () => {
      // Check if user exists first
      const existingUser = await db.select().from(users).where(eq(users.id, id));
      if (!existingUser.length) {
        throw new DatabaseError('User not found', DatabaseErrorCode.NOT_FOUND);
      }

      const validatedData = validateUser(userData, { requireAll: false }) as Partial<{
        email: string;
        name: string;
        status: UserStatus;
      }>;

      const result = await db
        .update(users)
        .set({ ...validatedData, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();

      return result[0];
    });
  },

  updateMany: async (filter: { status: UserStatus }, update: Partial<NewUser>): Promise<number> => {
    return dbOperation(async () => {
      const validatedData = validateUser(update, { requireAll: false }) as Partial<{
        email: string;
        name: string;
        status: UserStatus;
      }>;

      const result = await db
        .update(users)
        .set({ ...validatedData, updatedAt: new Date() })
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
