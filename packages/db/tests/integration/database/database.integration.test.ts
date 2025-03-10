import { sql } from 'drizzle-orm';
import { describe, it, expect, afterAll } from 'vitest';

import { createTestContext, closeTestConnection } from '../test-utils/database';

describe('Database Client', () => {
  // Close shared connection after all tests
  afterAll(async () => {
    await closeTestConnection();
  });

  describe('Query Execution', () => {
    it('should successfully execute a query', async () => {
      const testCtx = createTestContext();
      const result = await testCtx.db.execute(sql`SELECT 1 as test`);
      expect(result[0]).toEqual({ test: 1 });
    });

    it('should handle transaction rollback', async () => {
      const testCtx = createTestContext();
      await testCtx.db
        .transaction(async (tx) => {
          await tx.execute(
            sql`CREATE TEMPORARY TABLE test_rollback (id serial primary key, value text)`
          );
          await tx.execute(sql`INSERT INTO test_rollback (value) VALUES (${'test'})`);
          throw new Error('Force rollback');
        })
        .catch((error) => {
          expect(error.message).toBe('Force rollback');
        });

      // Verify table doesn't exist after rollback
      const error = await testCtx.db.execute(sql`SELECT * FROM test_rollback`).catch((e) => e);
      expect(error).toBeDefined();
      expect(error.message).toContain('test_rollback');
    });

    it('should handle transaction commit', async () => {
      const testCtx = createTestContext();
      await testCtx.db.transaction(async (tx) => {
        await tx.execute(
          sql`CREATE TEMPORARY TABLE test_commit (id serial primary key, value text)`
        );
        await tx.execute(sql`INSERT INTO test_commit (value) VALUES (${'test'})`);
      });

      // Verify data was committed
      const result = await testCtx.db.execute(sql`SELECT value FROM test_commit`);
      expect(result[0]).toEqual({ value: 'test' });
    });
  });
});
