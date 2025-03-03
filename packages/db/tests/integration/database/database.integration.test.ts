import { sql } from 'drizzle-orm';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import { db, client, checkDatabaseConnection } from '../../../src/database';

describe('Database Client', () => {
  beforeAll(async () => {
    // Ensure we can connect before running tests
    const isConnected = await checkDatabaseConnection();
    expect(isConnected).toBe(true);
  });

  afterAll(async () => {
    await client.end();
  });

  describe('Query Execution', () => {
    it('should successfully execute a query', async () => {
      const result = await db.execute(sql`SELECT 1 as test`);
      expect(result[0]).toEqual({ test: 1 });
    });
  });
});
