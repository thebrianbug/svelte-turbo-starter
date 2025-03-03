import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { getDatabaseConfig } from './config';

describe('Database Configuration', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv };
    // Set default test values
    process.env.NODE_ENV = 'development';
    process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/svelte_turbo_db';
  });

  afterEach(() => {
    // Restore original environment after each test
    process.env = { ...originalEnv };
  });

  it('should use DATABASE_URL from environment', () => {
    const config = getDatabaseConfig();
    expect(config).toBe('postgresql://postgres:postgres@localhost:5432/svelte_turbo_db');
  });

  it('should throw error if DATABASE_URL is not set', () => {
    delete process.env.DATABASE_URL;
    expect(() => getDatabaseConfig()).toThrow('DATABASE_URL environment variable is required');
  });

  it('should use test database when NODE_ENV is test', () => {
    process.env.NODE_ENV = 'test';
    const config = getDatabaseConfig();
    expect(config).toBe('postgresql://postgres:postgres@localhost:5432/svelte_turbo_test_db');
  });
});
