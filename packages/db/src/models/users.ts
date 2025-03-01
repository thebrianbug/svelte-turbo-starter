import { eq, and, sql } from 'drizzle-orm';
import { users, type User, type NewUser, type UserStatus } from '../schema/users';
import { db } from '../database';
import { validateUser, validateManyUsers } from '../validators/user';

class UserRepository {
  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private prepareForUpdate(data: Partial<NewUser>): Partial<NewUser> {
    const prepared = { ...data };
    if (prepared.email) {
      prepared.email = this.normalizeEmail(prepared.email);
    }
    prepared.updatedAt = new Date();
    return prepared;
  }

  async findById(id: number): Promise<User | undefined> {
    const [result] = await db.select().from(users).where(eq(users.id, id));
    return result;
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const [result] = await db
      .select()
      .from(users)
      .where(eq(users.email, this.normalizeEmail(email)));
    return result;
  }

  async findActive(): Promise<User[]> {
    return db.select().from(users).where(eq(users.status, 'active'));
  }

  async create(newUser: NewUser): Promise<User> {
    const validatedUser = validateUser(newUser, { requireAll: true }) as Required<NewUser>;
    validatedUser.email = this.normalizeEmail(validatedUser.email);

    const [result] = await db.insert(users).values(validatedUser).returning();
    return result;
  }

  async createMany(newUsers: NewUser[]): Promise<User[]> {
    if (!newUsers.length) return [];

    const validatedUsers = validateManyUsers(newUsers, { requireAll: true }) as Required<NewUser>[];
    const normalizedUsers = validatedUsers.map((user) => ({
      ...user,
      email: this.normalizeEmail(user.email)
    }));

    return db.insert(users).values(normalizedUsers).returning();
  }

  async update(id: number, userData: Partial<NewUser>): Promise<User | undefined> {
    const validatedData = validateUser(userData, { requireAll: false });
    const preparedData = this.prepareForUpdate(validatedData);

    const [result] = await db.update(users).set(preparedData).where(eq(users.id, id)).returning();
    return result;
  }

  async updateMany(filter: { status: UserStatus }, update: Partial<NewUser>): Promise<number> {
    const validatedData = validateUser(update, { requireAll: false });
    const preparedData = this.prepareForUpdate(validatedData);

    const result = await db
      .update(users)
      .set(preparedData)
      .where(eq(users.status, filter.status))
      .returning();
    return result.length;
  }

  async softDelete(id: number): Promise<boolean> {
    const result = await db
      .update(users)
      .set(this.prepareForUpdate({ status: 'inactive' }))
      .where(and(eq(users.id, id), eq(users.status, 'active')))
      .returning();
    return result.length > 0;
  }

  async softDeleteMany(filter: { status: 'active' }): Promise<number> {
    const result = await db
      .update(users)
      .set(this.prepareForUpdate({ status: 'inactive' }))
      .where(eq(users.status, filter.status))
      .returning();
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
