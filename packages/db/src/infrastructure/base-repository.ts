import { sql } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';

import { DatabaseError } from '@repo/shared';
import { getConnection } from '../database';

export type DatabaseType = ReturnType<typeof getConnection>['db'];
export type TransactionType = Parameters<Parameters<DatabaseType['transaction']>[0]>[0];

export type BaseEntity = {
  id: number;
  createdAt: Date;
  updatedAt: Date;
};

export abstract class BaseRepository<T extends BaseEntity> {
  protected abstract readonly table: PgTable;
  protected abstract readonly entityType: string;

  constructor(
    protected readonly dbConnection?: ReturnType<typeof getConnection>,
    protected readonly tx?: TransactionType
  ) {}

  protected mapToEntity(record: Record<string, unknown>): T {
    return record as T;
  }

  protected getExecutor() {
    return this.tx || (this.dbConnection || getConnection()).db;
  }

  async withTransaction<TResult>(
    callback: (tx: TransactionType) => Promise<TResult>
  ): Promise<TResult> {
    try {
      const executor = this.getExecutor();
      return await executor.transaction(async (tx) => {
        return await callback(tx);
      });
    } catch (error) {
      throw DatabaseError.from(this.entityType, error, 'transaction');
    }
  }

  async findById(id: number, tx?: TransactionType): Promise<T | undefined> {
    const executor = tx || this.getExecutor();
    try {
      const [result] = await executor
        .select()
        .from(this.table)
        .where(sql`${this.table}.id = ${id}`);
      return result ? this.mapToEntity(result) : undefined;
    } catch (error) {
      throw DatabaseError.from(this.entityType, error, 'findById');
    }
  }

  async findAll(tx?: TransactionType): Promise<T[]> {
    const executor = tx || this.getExecutor();
    try {
      const results = await executor.select().from(this.table);
      return results.map(this.mapToEntity);
    } catch (error) {
      throw DatabaseError.from(this.entityType, error, 'findAll');
    }
  }

  async create(data: Omit<T, keyof BaseEntity>, tx?: TransactionType): Promise<T> {
    const executor = tx || this.getExecutor();
    try {
      const now = new Date();
      const [result] = await executor
        .insert(this.table)
        .values({
          ...data,
          createdAt: now,
          updatedAt: now
        })
        .returning();
      return this.mapToEntity(result);
    } catch (error) {
      throw DatabaseError.from(this.entityType, error, 'create');
    }
  }

  async update(
    id: number,
    data: Partial<Omit<T, keyof BaseEntity>>,
    tx?: TransactionType
  ): Promise<T | undefined> {
    const executor = tx || this.getExecutor();
    try {
      const [result] = await executor
        .update(this.table)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(sql`${this.table}.id = ${id}`)
        .returning();
      return result ? this.mapToEntity(result) : undefined;
    } catch (error) {
      throw DatabaseError.from(this.entityType, error, 'update');
    }
  }

  async delete(id: number, tx?: TransactionType): Promise<boolean> {
    const executor = tx || this.getExecutor();
    try {
      const [result] = await executor
        .delete(this.table)
        .where(sql`${this.table}.id = ${id}`)
        .returning();
      return !!result;
    } catch (error) {
      throw DatabaseError.from(this.entityType, error, 'delete');
    }
  }
}
