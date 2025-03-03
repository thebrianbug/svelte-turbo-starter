import { eq, and, sql } from 'drizzle-orm';

import { db } from '../../database';

import { users, type User, type NewUser, type UserStatus } from './schema';
import { validateUser, validateManyUsers } from './validator';

class UserRepository {
  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private prepareForUpdate(data: Partial<NewUser>): Partial<NewUser> {
    const prepared = { ...data };
    if (prepared.email !== undefined) {
      prepared.email = this.normalizeEmail(prepared.email);
    }
    prepared.updatedAt = new Date();
    return prepared;
  }

  async findById(id: number): Promise<User | undefined> {
    const [result] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        status: users.status,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      })
      .from(users)
      .where(eq(users.id, id));
    return result;
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const [result] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        status: users.status,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      })
      .from(users)
      .where(eq(users.email, this.normalizeEmail(email)));
    return result;
  }

  async findActive(): Promise<User[]> {
    return db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        status: users.status,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      })
      .from(users)
      .where(eq(users.status, 'active'));
  }

  async create(newUser: NewUser): Promise<User> {
    const validatedUser = validateUser(newUser, { requireAll: true }) as Required<NewUser>;
    validatedUser.email = this.normalizeEmail(validatedUser.email);

    const [result] = await db.insert(users).values(validatedUser).returning({
      id: users.id,
      name: users.name,
      email: users.email,
      status: users.status,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt
    });
    return result;
  }

  async createMany(newUsers: NewUser[]): Promise<User[]> {
    if (newUsers.length === 0) return [];

    const validatedUsers = validateManyUsers(newUsers, { requireAll: true }) as Required<NewUser>[];
    const normalizedUsers = validatedUsers.map((user) => ({
      ...user,
      email: this.normalizeEmail(user.email)
    }));

    return db.insert(users).values(normalizedUsers).returning({
      id: users.id,
      name: users.name,
      email: users.email,
      status: users.status,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt
    });
  }

  async update(id: number, userData: Partial<NewUser>): Promise<User | undefined> {
    const validatedData = validateUser(userData, { requireAll: false });
    const preparedData = this.prepareForUpdate(validatedData);

    const [result] = await db.update(users).set(preparedData).where(eq(users.id, id)).returning({
      id: users.id,
      name: users.name,
      email: users.email,
      status: users.status,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt
    });
    return result;
  }

  async updateMany(filter: { status: UserStatus }, update: Partial<NewUser>): Promise<number> {
    const validatedData = validateUser(update, { requireAll: false });
    const preparedData = this.prepareForUpdate(validatedData);

    const result = await db
      .update(users)
      .set(preparedData)
      .where(eq(users.status, filter.status))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        status: users.status,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      });
    return result.length;
  }

  async softDelete(id: number): Promise<boolean> {
    const result = await db
      .update(users)
      .set(this.prepareForUpdate({ status: 'inactive' }))
      .where(and(eq(users.id, id), eq(users.status, 'active')))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        status: users.status,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      });
    return result.length > 0;
  }

  async softDeleteMany(filter: { status: 'active' }): Promise<number> {
    const result = await db
      .update(users)
      .set(this.prepareForUpdate({ status: 'inactive' }))
      .where(eq(users.status, filter.status))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        status: users.status,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      });
    return result.length;
  }

  async count(filter?: { status?: UserStatus }): Promise<number> {
    const query = db.select({ count: sql<number>`count(*)` }).from(users);
    if (filter?.status) {
      query.where(eq(users.status, filter.status));
    }
    const [result] = await query;
    return Number(result.count);
  }
}

export const userQueries = new UserRepository();
