import { eq } from 'drizzle-orm';
import { users, type User, type NewUser } from './schema';
import { db } from './index';
import { dbOperation } from './utils';

export const userQueries = {
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
      const result = await db.insert(users).values(newUser).returning();
      return result[0];
    });
  },

  update: async (id: number, userData: Partial<NewUser>): Promise<User | undefined> => {
    return dbOperation(async () => {
      const result = await db
        .update(users)
        .set({ ...userData, updatedAt: new Date() })
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
