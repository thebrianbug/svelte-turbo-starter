import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { databaseConfig } from './database';

describe('database config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should use default database URL when environment variable is not set', () => {
    delete process.env.DATABASE_URL;
    expect(databaseConfig.url).toBe('postgres://postgres:postgres@localhost:5432/svelte_turbo_db');
  });

  it('should use environment variable for database URL when set', () => {
    const testUrl = 'postgres://test:test@testhost:5432/testdb';
    process.env.DATABASE_URL = testUrl;
    expect(databaseConfig.url).toBe(testUrl);
  });

  it('should have correct pool configuration', () => {
    expect(databaseConfig.pool).toEqual({
      max: 10,
      idleTimeout: 20,
      maxLifetime: 60,
      connectTimeout: 5
    });
  });

  it('should have correct migration configuration', () => {
    expect(databaseConfig.migration).toEqual({
      max: 1,
      idleTimeout: 5,
      maxLifetime: 15
    });
  });
});
