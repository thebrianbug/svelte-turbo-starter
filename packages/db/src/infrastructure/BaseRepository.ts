import { PostgresError } from 'postgres';
import { sql, SQL } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';
import { db } from '../database';

export class DatabaseError extends Error {
  constructor(operation: string, message: string) {
    super(`Failed to ${operation}: ${message}`);
    this.name = 'DatabaseError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(`Validation error: ${message}`);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(entity: string, identifier: string | number) {
    super(`${entity} not found: ${identifier}`);
    this.name = 'NotFoundError';
  }
}

export class UniqueConstraintError extends Error {
  constructor(entity: string, field: string, value: string) {
    super(`${entity} with ${field} already exists: ${value}`);
    this.name = 'UniqueConstraintError';
  }
}

export interface BaseEntity {
  id: number;
  createdAt: Date;
  updatedAt: Date;
}

export type DatabaseRecord = Record<string, unknown>;

export abstract class BaseRepository<
  T extends BaseEntity,
  TCreate extends DatabaseRecord = Omit<T, keyof BaseEntity>,
  TUpdate extends DatabaseRecord = Partial<TCreate>
> {
  protected abstract readonly tableName: string;
  protected abstract readonly table: PgTable;

  protected handleError(error: unknown, operation: string): never {
    if (error instanceof PostgresError) {
      if (error.code === '23505') {
        // unique_violation
        throw new UniqueConstraintError(this.tableName, 'unknown', 'value');
      }
    }
    if (error instanceof Error) {
      throw new DatabaseError(operation, error.message);
    }
    throw new DatabaseError(operation, 'Unknown error occurred');
  }

  protected async executeQuery<R>(operation: string, query: () => Promise<R>): Promise<R> {
    try {
      return await query();
    } catch (error: unknown) {
      throw this.handleError(error, operation);
    }
  }

  protected mapToEntity(record: DatabaseRecord): T {
    return record as unknown as T;
  }

  async findById(id: number): Promise<T | undefined> {
    return this.executeQuery('findById', async () => {
      const [result] = await db
        .select()
        .from(this.table)
        .where(sql`${this.table}.id = ${id}`);
      return result ? this.mapToEntity(result) : undefined;
    });
  }

  async findAll(): Promise<T[]> {
    return this.executeQuery('findAll', async () => {
      const results = await db.select().from(this.table);
      return results.map((record) => this.mapToEntity(record));
    });
  }

  async create(data: TCreate): Promise<T> {
    return this.executeQuery('create', async () => {
      const now = new Date();
      const [result] = await db
        .insert(this.table)
        .values({
          ...data,
          createdAt: now,
          updatedAt: now
        } as unknown as DatabaseRecord)
        .returning();
      return this.mapToEntity(result);
    });
  }

  async update(id: number, data: TUpdate): Promise<T> {
    return this.executeQuery('update', async () => {
      const [result] = await db
        .update(this.table)
        .set({
          ...data,
          updatedAt: new Date()
        } as unknown as DatabaseRecord)
        .where(sql`${this.table}.id = ${id}`)
        .returning();

      if (!result) {
        throw new NotFoundError(this.tableName, id);
      }

      return this.mapToEntity(result);
    });
  }

  async delete(id: number): Promise<boolean> {
    return this.executeQuery('delete', async () => {
      const [result] = await db
        .delete(this.table)
        .where(sql`${this.table}.id = ${id}`)
        .returning();
      return !!result;
    });
  }

  async transaction<R>(callback: (tx: typeof db) => Promise<R>): Promise<R> {
    return db.transaction(async (tx) => {
      try {
        return await callback(tx);
      } catch (error: unknown) {
        if (error instanceof Error) {
          throw new DatabaseError('transaction', error.message);
        }
        throw new DatabaseError('transaction', 'Unknown error occurred');
      }
    });
  }
}
