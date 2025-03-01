import { eq, and, sql } from 'drizzle-orm';
import { PostgresError } from 'postgres';
import { db } from '../../../database';
import type { IUserRepository } from '../interfaces/IUserRepository';
import type { User, NewUser, UserStatus } from '../models/User';
import { validateUser, validateManyUsers } from '../models/User';
import { users } from '../schema';
import {
  UserNotFoundError,
  UserEmailExistsError,
  UserValidationError,
  UserOperationError
} from '../models/UserErrors';
import { BaseRepository } from '../../../infrastructure/BaseRepository';

export class UserRepository extends BaseRepository<User, NewUser> implements IUserRepository {
  protected readonly tableName = 'users';
  protected readonly table = users;

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  protected override mapToEntity(record: Record<string, unknown>): User {
    return {
      id: record.id as number,
      name: record.name as string,
      email: record.email as string,
      status: record.status as UserStatus,
      createdAt: record.createdAt as Date,
      updatedAt: record.updatedAt as Date
    };
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return this.executeQuery('findByEmail', async () => {
      const [result] = await db
        .select()
        .from(users)
        .where(eq(users.email, this.normalizeEmail(email)));
      return result ? this.mapToEntity(result) : undefined;
    });
  }

  async findActive(): Promise<User[]> {
    return this.executeQuery('findActive', async () => {
      const results = await db.select().from(users).where(eq(users.status, 'active'));
      return results.map(this.mapToEntity);
    });
  }

  override async create(newUser: NewUser): Promise<User> {
    try {
      // Normalize email before validation
      const userToValidate = {
        ...newUser,
        email: this.normalizeEmail(newUser.email)
      };

      const validatedUser = validateUser(userToValidate, { requireAll: true }) as Required<NewUser>;

      return await super.create(validatedUser);
    } catch (error) {
      if (error instanceof PostgresError && error.code === '23505') {
        throw new UserEmailExistsError(newUser.email);
      }
      if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
        throw new UserValidationError(String(error));
      }
      throw new UserOperationError(
        'create',
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  async createMany(newUsers: NewUser[]): Promise<User[]> {
    if (!newUsers.length) return [];

    return this.executeQuery('createMany', async () => {
      // Normalize emails before validation
      const usersToValidate = newUsers.map((user) => ({
        ...user,
        email: this.normalizeEmail(user.email)
      }));

      const validatedUsers = validateManyUsers(usersToValidate, {
        requireAll: true
      }) as Required<NewUser>[];

      const results = await db.insert(users).values(validatedUsers).returning();

      return results.map(this.mapToEntity);
    });
  }

  override async update(id: number, userData: Partial<NewUser>): Promise<User> {
    try {
      // Normalize email if present
      const dataToValidate = userData.email
        ? { ...userData, email: this.normalizeEmail(userData.email) }
        : userData;

      const validatedData = validateUser(dataToValidate, { requireAll: false });

      return await super.update(id, validatedData);
    } catch (error) {
      if (error instanceof PostgresError && error.code === '23505') {
        throw new UserEmailExistsError(userData.email || '');
      }
      if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
        throw new UserValidationError(String(error));
      }
      throw new UserOperationError(
        'update',
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  async updateMany(filter: { status: UserStatus }, update: Partial<NewUser>): Promise<number> {
    return this.executeQuery('updateMany', async () => {
      // Normalize email if present
      const dataToValidate = update.email
        ? { ...update, email: this.normalizeEmail(update.email) }
        : update;

      const validatedData = validateUser(dataToValidate, { requireAll: false });

      const result = await db
        .update(users)
        .set({ ...validatedData, updatedAt: new Date() })
        .where(eq(users.status, filter.status))
        .returning();

      return result.length;
    });
  }

  async softDelete(id: number): Promise<boolean> {
    return this.executeQuery('softDelete', async () => {
      const result = await db
        .update(users)
        .set({ status: 'inactive', updatedAt: new Date() })
        .where(and(eq(users.id, id), eq(users.status, 'active')))
        .returning();

      if (!result.length) {
        throw new UserNotFoundError(id);
      }

      return true;
    });
  }

  async softDeleteMany(filter: { status: 'active' }): Promise<number> {
    return this.executeQuery('softDeleteMany', async () => {
      const result = await db
        .update(users)
        .set({ status: 'inactive', updatedAt: new Date() })
        .where(eq(users.status, filter.status))
        .returning();

      return result.length;
    });
  }

  async count(filter?: { status?: UserStatus }): Promise<number> {
    return this.executeQuery('count', async () => {
      const query = db.select({ count: sql<number>`count(*)` }).from(users);
      if (filter?.status) {
        query.where(eq(users.status, filter.status));
      }
      const [result] = await query;
      return Number(result.count);
    });
  }
}

// Export singleton instance
export const userQueries = new UserRepository();
