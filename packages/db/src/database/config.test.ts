import { describe, it, expect } from 'vitest';

import { getDatabaseConfig } from './index';

describe('Database Configuration', () => {
  it('should return default config when no env vars set', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    const config = getDatabaseConfig();
    process.env.NODE_ENV = originalEnv;
    expect(config.url).toBe('postgresql://postgres:postgres@localhost:5432/svelte_turbo_db');
    expect(config.pool.max).toBe(10);
  });

  it('should use DATABASE_URL from env when available', () => {
    const originalEnv = process.env.NODE_ENV;
    const originalUrl = process.env.DATABASE_URL;
    process.env.NODE_ENV = 'development';
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
    const config = getDatabaseConfig();
    expect(config.url).toBe('postgresql://test:test@localhost:5432/test_db');
    // Reset env
    process.env.NODE_ENV = originalEnv;
    process.env.DATABASE_URL = originalUrl;
  });
});
