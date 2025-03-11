import { sql } from 'drizzle-orm';
import { describe, it, expect, afterAll, beforeAll } from 'vitest';

import { 
  closeTestConnection, 
  executeTestInTransaction,
  createMigratedTestContext
} from '../test-utils/database';

describe('Database Client', () => {
  // Initialize database before tests and close connection after
  beforeAll(async () => {
    await createMigratedTestContext();
  });
  
  afterAll(async () => {
    await closeTestConnection();
  });

  describe('Query Execution', () => {
    it('should successfully execute a query', async () => {
      // Even simple queries should be in a transaction for consistency
      await executeTestInTransaction(async (tx) => {
        const result = await tx.execute(sql`SELECT 1 as test`);
        expect(result[0]).toEqual({ test: 1 });
      });
    });

    it('should handle transaction rollback', async () => {
      let tableCreated = false;
      
      // First transaction - will be rolled back due to error
      await executeTestInTransaction(async (tx) => {
        // Create temporary table within transaction
        await tx.execute(
          sql`CREATE TEMPORARY TABLE test_rollback (id serial primary key, value text)`
        );
        await tx.execute(sql`INSERT INTO test_rollback (value) VALUES (${'test'})`);
        
        // Verify data exists within transaction
        const result = await tx.execute(sql`SELECT value FROM test_rollback`);
        expect(result[0]).toEqual({ value: 'test' });
        tableCreated = true;
        
        // Simulate rollback by throwing error
        throw new Error('Force rollback');
      }).catch((error) => {
        expect(error.message).toBe('Force rollback');
      });
      
      expect(tableCreated).toBe(true);
      
      // Second transaction - verify table doesn't exist after rollback
      await executeTestInTransaction(async (tx) => {
        const error = await tx.execute(sql`SELECT * FROM test_rollback`).catch((e) => e);
        expect(error).toBeDefined();
        expect(error.message).toContain('test_rollback');
      });
    });

    it('should handle transaction commit within isolation boundary', async () => {
      // This test demonstrates a "commit" within the context of a transaction
      // that will ultimately be rolled back for test isolation
      await executeTestInTransaction(async (tx) => {
        // Create temporary table
        await tx.execute(
          sql`CREATE TEMPORARY TABLE test_commit (id serial primary key, value text)`
        );
        
        // Nested transaction that will be committed within the outer transaction
        await tx.transaction(async (nestedTx) => {
          await nestedTx.execute(sql`INSERT INTO test_commit (value) VALUES (${'test'})`);
        });
        
        // Verify data exists after nested transaction commit
        const result = await tx.execute(sql`SELECT value FROM test_commit`);
        expect(result[0]).toEqual({ value: 'test' });
      });
      
      // Verify the table doesn't exist outside the transaction (due to rollback)
      // Use executeTestInTransaction to ensure isolation
      await executeTestInTransaction(async (tx) => {
        const error = await tx.execute(sql`SELECT * FROM test_commit`).catch((e) => e);
        expect(error).toBeDefined();
        expect(error.message).toContain('test_commit');
      });
    });
    
    it('should properly isolate test data between tests', async () => {
      // This test demonstrates that temporary tables from previous tests don't exist
      // Use executeTestInTransaction to ensure isolation
      await executeTestInTransaction(async (tx) => {
        // These tables should not exist if our transaction isolation is working
        const checkTables = [
          'test_rollback',
          'test_commit'
        ];
        
        for (const tableName of checkTables) {
          const error = await tx.execute(sql`SELECT * FROM ${sql.identifier(tableName)}`).catch((e) => e);
          expect(error).toBeDefined();
          // Check for relation not found, transaction aborted, or other PostgreSQL errors
          expect(error.message).toMatch(/relation.*does not exist|test_\w+|transaction is aborted/);
        }
      });
    });
  });
});
