import { describe, it, expect } from 'vitest';
import { databaseConfig } from './database';

describe('database config', () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;

  it('should use default database URL when environment variable is not set', () => {
    delete process.env.DATABASE_URL;
    expect(databaseConfig.url).toBe('postgres://postgres:postgres@localhost:5432/svelte_turbo_db');
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  it('should use environment variable for database URL when set', () => {
    const testUrl = 'postgres://test:test@testhost:5432/testdb';
    process.env.DATABASE_URL = testUrl;
    expect(databaseConfig.url).toBe(testUrl);
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  it('should have correct pool configuration', () => {
    expect(databaseConfig.pool).toEqual({
      max: 10
    });
  });
});
