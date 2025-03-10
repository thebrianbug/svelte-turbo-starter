import { eq, sql } from 'drizzle-orm';

import { getConnection } from '../../../database';
import { BaseRepository, type TransactionType } from '../../../infrastructure/base-repository';
import { validateNewUser, validateUpdateUser, validateManyNewUsers } from '../models/user';
import { DatabaseError } from '@repo/shared';

import { users } from '../schema/schema';
import type {
  User,
  NewUser,
  UserStatus,
  ValidatedNewUser,
  ValidatedUpdateUser
} from '../models/user';
import type { IUserRepository } from '../interfaces/i-user-repository';

class UserRepository extends BaseRepository<User> implements IUserRepository {
  protected readonly table = users;
  protected readonly entityType = 'user';

  constructor(dbConnection?: ReturnType<typeof getConnection>, tx?: TransactionType) {
    super(dbConnection, tx);
  }

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

  async findByEmail(email: string, tx?: TransactionType): Promise<User | undefined> {
    const executor = tx || this.getExecutor();
    try {
      const [result] = await executor
        .select()
        .from(users)
        .where(eq(users.email, UserRepository.normalizeEmail(email)));
      return result ? this.mapToEntity(result) : undefined;
    } catch (error) {
      throw DatabaseError.from(this.entityType, error, 'findByEmail');
    }
  }

  async findActive(tx?: TransactionType): Promise<User[]> {
    const executor = tx || this.getExecutor();
    try {
      const results = await executor.select().from(users).where(eq(users.status, 'active'));
      return results.map(this.mapToEntity);
    } catch (error) {
      throw DatabaseError.from(this.entityType, error, 'findActive');
    }
  }

  async create(data: ValidatedNewUser, tx?: TransactionType): Promise<User> {
    try {
      const normalizedData = UserRepository.prepareUserData(data);
      const validatedData = validateNewUser(normalizedData);
      return await super.create(validatedData, tx);
    } catch (error) {
      throw DatabaseError.from(this.entityType, error, 'create');
    }
  }

  async createMany(newUsers: NewUser[], tx?: TransactionType): Promise<User[]> {
    if (newUsers.length === 0) return [];

    const executor = tx || this.getExecutor();
    try {
      const preparedUsers = newUsers.map(UserRepository.prepareUserData);
      const validatedUsers = validateManyNewUsers(preparedUsers);

      const now = new Date();
      const usersToCreate = validatedUsers.map((user) => ({
        ...user,
        createdAt: now,
        updatedAt: now
      }));

      const results = await executor.insert(this.table).values(usersToCreate).returning();
      return results.map(this.mapToEntity);
    } catch (error) {
      throw DatabaseError.from(this.entityType, error, 'createMany');
    }
  }

  async update(id: number, data: ValidatedUpdateUser, tx?: TransactionType): Promise<User> {
    const executor = tx || this.getExecutor();
    try {
      const [result] = await executor
        .update(this.table)
        .set({
          ...UserRepository.prepareUserData(data),
          updatedAt: new Date()
        })
        .where(sql`${this.table}.id = ${id}`)
        .returning();

      if (!result) {
        throw new DatabaseError('NOT_FOUND', `User not found with id ${id}`, { id });
      }
      return this.mapToEntity(result);
    } catch (error) {
      throw DatabaseError.from(this.entityType, error, 'update');
    }
  }

  async updateMany(
    filter: { status: UserStatus },
    data: Partial<NewUser>,
    tx?: TransactionType
  ): Promise<number> {
    const executor = tx || this.getExecutor();
    try {
      const normalizedData = UserRepository.prepareUserData(data);
      const validatedData = validateUpdateUser(normalizedData);

      const result = await executor
        .update(this.table)
        .set({ ...validatedData, updatedAt: new Date() })
        .where(eq(users.status, filter.status))
        .returning();

      return result.length;
    } catch (error) {
      throw DatabaseError.from(this.entityType, error, 'updateMany');
    }
  }

  async softDelete(id: number, tx?: TransactionType): Promise<boolean> {
    const executor = tx || this.getExecutor();
    try {
      const result = await executor
        .update(this.table)
        .set({ status: 'inactive', updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();

      return result.length === 1;
    } catch (error) {
      throw DatabaseError.from(this.entityType, error, 'softDelete');
    }
  }

  async softDeleteMany(filter: { status: 'active' }, tx?: TransactionType): Promise<number> {
    const executor = tx || this.getExecutor();
    try {
      const result = await executor
        .update(this.table)
        .set({ status: 'inactive', updatedAt: new Date() })
        .where(eq(users.status, filter.status))
        .returning();

      return result.length;
    } catch (error) {
      throw DatabaseError.from(this.entityType, error, 'softDeleteMany');
    }
  }

  async count(filter?: { status?: UserStatus }, tx?: TransactionType): Promise<number> {
    const executor = tx || this.getExecutor();
    try {
      const query = executor.select({ count: sql<number>`count(*)` }).from(this.table);

      if (filter?.status) {
        query.where(eq(users.status, filter.status));
      }

      const [result] = await query;
      return Number(result.count);
    } catch (error) {
      throw DatabaseError.from(this.entityType, error, 'count');
    }
  }
}

export { UserRepository };
