import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { getDatabaseConfig } from './index';

describe('Database Configuration', () => {
  // Store original env vars
  const originalEnv = {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    PGUSER: process.env.PGUSER,
    PGPASSWORD: process.env.PGPASSWORD
  };

  // Reset env vars before each test
  beforeEach(() => {
    process.env.NODE_ENV = 'development';
    delete process.env.DATABASE_URL;
    delete process.env.PGUSER;
    delete process.env.PGPASSWORD;
  });

  // Restore original env vars after each test
  afterEach(() => {
    process.env.NODE_ENV = originalEnv.NODE_ENV;
    process.env.DATABASE_URL = originalEnv.DATABASE_URL;
    process.env.PGUSER = originalEnv.PGUSER;
    process.env.PGPASSWORD = originalEnv.PGPASSWORD;
  });

  it('should return default config when no env vars set', () => {
    const config = getDatabaseConfig();
    expect(config.url).toBe('postgresql://postgres:postgres@localhost:5432/svelte_turbo_db');
    expect(config.pool.max).toBe(10);
  });

  it('should use DATABASE_URL from env when available and valid', () => {
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
    const config = getDatabaseConfig();
    expect(config.url).toBe('postgresql://test:test@localhost:5432/test_db');
  });

  it('should construct URL from PGUSER and PGPASSWORD when DATABASE_URL is masked', () => {
    process.env.DATABASE_URL = '***localhost:5432/test_db';
    process.env.PGUSER = 'testuser';
    process.env.PGPASSWORD = 'testpass';
    const config = getDatabaseConfig();
    expect(config.url).toBe('postgresql://testuser:testpass@localhost:5432/svelte_turbo_db');
  });

  it('should use test database when NODE_ENV is test', () => {
    process.env.NODE_ENV = 'test';
    process.env.PGUSER = 'testuser';
    process.env.PGPASSWORD = 'testpass';
    const config = getDatabaseConfig();
    expect(config.url).toBe('postgresql://testuser:testpass@localhost:5432/svelte_turbo_test_db');
    expect(config.pool.max).toBe(3);
    expect(config.pool.timeout).toBe(5000);
  });

  it('should handle invalid DATABASE_URL by falling back to PGUSER/PGPASSWORD', () => {
    process.env.DATABASE_URL = 'invalid-url';
    process.env.PGUSER = 'testuser';
    process.env.PGPASSWORD = 'testpass';
    const config = getDatabaseConfig();
    expect(config.url).toBe('postgresql://testuser:testpass@localhost:5432/svelte_turbo_db');
  });
});
