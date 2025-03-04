import { eq, sql } from 'drizzle-orm';

import { db } from '../../../database';
import { BaseRepository, DatabaseError } from '../../../infrastructure/base-repository';
import { validateNewUser, validateUpdateUser, validateManyNewUsers } from '../models/user';
import { users, type User, type NewUser, type UserStatus } from '../schema';
import type { IUserRepository } from '../interfaces/i-user-repository';

class UserRepository extends BaseRepository<User> implements IUserRepository {
  protected readonly table = users;

  private static normalizeEmail = (email: string): string => email.trim().toLowerCase();

  private static prepareUserData<T extends { email?: string }>(data: T): T {
    if (data.email === undefined) return data;
    return {
      ...data,
      email: UserRepository.normalizeEmail(data.email)
    };
  }

  protected mapToEntity(record: Record<string, unknown>): User {
    return {
      id: record.id as number,
      name: record.name as string,
      email: record.email as string,
      status: record.status as UserStatus,
      createdAt: record.createdAt as Date,
      updatedAt: record.updatedAt as Date
    };
  }

  async findByEmail(email: string): Promise<User> {
    try {
      const [result] = await db
        .select()
        .from(users)
        .where(eq(users.email, UserRepository.normalizeEmail(email)));
      return this.mapToEntity(result);
    } catch (error) {
      throw DatabaseError.from(error, 'findByEmail');
    }
  }

  async findActive(): Promise<User[]> {
    try {
      const results = await db.select().from(users).where(eq(users.status, 'active'));
      return results.map(this.mapToEntity);
    } catch (error) {
      throw DatabaseError.from(error, 'findActive');
    }
  }

  async create(data: NewUser): Promise<User> {
    try {
      const normalizedData = UserRepository.prepareUserData(data);
      const validatedData = validateNewUser(normalizedData);
      return await super.create(validatedData);
    } catch (error) {
      throw DatabaseError.from(error, 'create');
    }
  }

  async createMany(newUsers: NewUser[]): Promise<User[]> {
    if (newUsers.length === 0) return [];

    try {
      const preparedUsers = newUsers.map(UserRepository.prepareUserData);
      const validatedUsers = validateManyNewUsers(preparedUsers);

      const now = new Date();
      const usersToCreate = validatedUsers.map((user) => ({
        ...user,
        createdAt: now,
        updatedAt: now
      }));

      const results = await db.insert(this.table).values(usersToCreate).returning();
      return results.map(this.mapToEntity);
    } catch (error) {
      throw DatabaseError.from(error, 'createMany');
    }
  }

  async update(id: number, data: Partial<NewUser>): Promise<User> {
    try {
      const normalizedData = UserRepository.prepareUserData(data);
      const validatedData = validateUpdateUser(normalizedData);
      return await super.update(id, validatedData);
    } catch (error) {
      throw DatabaseError.from(error, 'update');
    }
  }

  async updateMany(filter: { status: UserStatus }, data: Partial<NewUser>): Promise<number> {
    try {
      const normalizedData = UserRepository.prepareUserData(data);
      const validatedData = validateUpdateUser(normalizedData);

      const result = await db
        .update(this.table)
        .set({ ...validatedData, updatedAt: new Date() })
        .where(eq(users.status, filter.status))
        .returning();

      return result.length;
    } catch (error) {
      throw DatabaseError.from(error, 'updateMany');
    }
  }

  async softDelete(id: number): Promise<boolean> {
    try {
      const result = await db
        .update(this.table)
        .set({ status: 'inactive', updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();

      return result.length === 1;
    } catch (error) {
      throw DatabaseError.from(error, 'softDelete');
    }
  }

  async softDeleteMany(filter: { status: 'active' }): Promise<number> {
    try {
      const result = await db
        .update(this.table)
        .set({ status: 'inactive', updatedAt: new Date() })
        .where(eq(users.status, filter.status))
        .returning();

      return result.length;
    } catch (error) {
      throw DatabaseError.from(error, 'softDeleteMany');
    }
  }

  async count(filter?: { status?: UserStatus }): Promise<number> {
    try {
      const query = db.select({ count: sql<number>`count(*)` }).from(this.table);

      if (filter?.status) {
        query.where(eq(users.status, filter.status));
      }

      const [result] = await query;
      return Number(result.count);
    } catch (error) {
      throw DatabaseError.from(error, 'count');
    }
  }
}

export { UserRepository };
