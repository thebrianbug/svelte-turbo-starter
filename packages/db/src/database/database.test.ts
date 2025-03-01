import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db, client, checkDatabaseConnection, getDatabaseConfig } from './index';
import { sql } from 'drizzle-orm';

describe('Database Configuration & Connection', () => {
  beforeAll(async () => {
    // Ensure we can connect before running tests
    const isConnected = await checkDatabaseConnection();
    expect(isConnected).toBe(true);
  });

  afterAll(async () => {
    await client.end();
  });

  describe('getDatabaseConfig', () => {
    it('should return default config when no env vars set', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      const config = getDatabaseConfig();
      process.env.NODE_ENV = originalEnv;
      expect(config.url).toBe('postgres://postgres:postgres@localhost:5432/svelte_turbo_db');
      expect(config.pool.max).toBe(10);
    });

    it('should use DATABASE_URL from env when available', () => {
      const originalEnv = process.env.NODE_ENV;
      const originalUrl = process.env.DATABASE_URL;
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = 'postgres://test:test@localhost:5432/test_db';
      const config = getDatabaseConfig();
      expect(config.url).toBe('postgres://test:test@localhost:5432/test_db');
      // Reset env
      process.env.NODE_ENV = originalEnv;
      process.env.DATABASE_URL = originalUrl;
    });
  });

  describe('Database Connection', () => {
    it('should successfully execute a query', async () => {
      const result = await db.execute(sql`SELECT 1 as test`);
      expect(result[0]).toEqual({ test: 1 });
    });

    it('should handle connection check', async () => {
      const isConnected = await checkDatabaseConnection();
      expect(isConnected).toBe(true);
    });
  });
});
