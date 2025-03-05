import { sql } from 'drizzle-orm';
import { PostgresError } from 'postgres';

import { db } from '../database';

import type { PgTable } from 'drizzle-orm/pg-core';

export class DatabaseError extends Error {
  constructor(
    public code: string,
    message: string,
    public field?: string
  ) {
    super(message);
    this.name = 'DatabaseError';
  }

  static from(error: unknown, operation: string): DatabaseError {
    if (error instanceof PostgresError) {
      if (error.code === '23505') {
        return new DatabaseError('UNIQUE_VIOLATION', 'Unique constraint violation');
      }
    }
    return new DatabaseError(
      'OPERATION_FAILED',
      `Failed to ${operation}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export type BaseEntity = {
  id: number;
  createdAt: Date;
  updatedAt: Date;
};

export abstract class BaseRepository<T extends BaseEntity> {
  protected abstract readonly table: PgTable;

  protected mapToEntity(record: Record<string, unknown>): T {
    return record as T;
  }

  async findById(id: number): Promise<T> {
    try {
      const [result] = await db
        .select()
        .from(this.table)
        .where(sql`${this.table}.id = ${id}`);
      return this.mapToEntity(result);
    } catch (error) {
      throw DatabaseError.from(error, 'findById');
    }
  }

  async findAll(): Promise<T[]> {
    try {
      const results = await db.select().from(this.table);
      return results.map(this.mapToEntity);
    } catch (error) {
      throw DatabaseError.from(error, 'findAll');
    }
  }

  async create(data: Omit<T, keyof BaseEntity>): Promise<T> {
    try {
      const now = new Date();
      const [result] = await db
        .insert(this.table)
        .values({
          ...data,
          createdAt: now,
          updatedAt: now
        })
        .returning();
      return this.mapToEntity(result);
    } catch (error) {
      throw DatabaseError.from(error, 'create');
    }
  }

  async update(id: number, data: Partial<Omit<T, keyof BaseEntity>>): Promise<T> {
    try {
      const [result] = await db
        .update(this.table)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(sql`${this.table}.id = ${id}`)
        .returning();

      return this.mapToEntity(result);
    } catch (error) {
      throw DatabaseError.from(error, 'update');
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await db
        .delete(this.table)
        .where(sql`${this.table}.id = ${id}`)
        .returning();
    } catch (error) {
      throw DatabaseError.from(error, 'delete');
    }
  }
}
