import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Dynamically import getConfig within tests after resetting modules
// Define the path as a constant
const CONFIG_PATH = './config';

describe('Database Configuration - getConfig()', () => {
  const originalEnv = { ...process.env };

  // Define constants for common values
  const DEV_NODE_ENV = 'development';
  const TEST_NODE_ENV = 'test';
  const DEFAULT_DB_URL = 'postgresql://user:pass@host:5432/devdb';
  const TEST_DB_URL = 'postgresql://test:test@testhost:5432/testdb';
  const FIRST_CACHE_DB_URL = 'postgresql://first:first@host:5432/firstdb';
  const SECOND_CACHE_DB_URL = 'postgresql://second:second@host:5432/seconddb';

  beforeEach(async () => {
    // Reset modules to clear cached config and re-evaluate imports
    vi.resetModules();
    // Reset environment variables
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment variables
    process.env = { ...originalEnv };
  });

  it('should load and validate DATABASE_URL and NODE_ENV from environment', async () => {
    process.env.NODE_ENV = DEV_NODE_ENV;
    process.env.DATABASE_URL = DEFAULT_DB_URL;

    // Import getConfig *after* setting env vars and resetting modules
    // Use the constant in the dynamic import
    const { getConfig } = await import(CONFIG_PATH);
    const config = getConfig();

    expect(config.NODE_ENV).toBe(DEV_NODE_ENV);
    expect(config.DATABASE_URL).toBe(DEFAULT_DB_URL);
  });

  it('should default NODE_ENV to development if not set', async () => {
    delete process.env.NODE_ENV;
    process.env.DATABASE_URL = DEFAULT_DB_URL;

    const { getConfig } = await import(CONFIG_PATH);
    const config = getConfig();

    expect(config.NODE_ENV).toBe(DEV_NODE_ENV);
  });

  it('should throw validation error if DATABASE_URL is missing', async () => {
    delete process.env.DATABASE_URL;

    const { getConfig } = await import(CONFIG_PATH);

    // Expect the function call to throw. Zod errors might be wrapped.
    expect(() => getConfig()).toThrow(/Invalid environment configuration|DATABASE_URL/i);
  });

  it('should throw validation error if DATABASE_URL is not a valid URL', async () => {
    process.env.DATABASE_URL = 'not-a-valid-url'; // Keep this literal as it's a specific invalid case

    const { getConfig } = await import(CONFIG_PATH);

    expect(() => getConfig()).toThrow(/Invalid environment configuration|DATABASE_URL/i);
  });

  it('should correctly use NODE_ENV=test when set', async () => {
    process.env.NODE_ENV = TEST_NODE_ENV;
    process.env.DATABASE_URL = TEST_DB_URL;

    const { getConfig } = await import(CONFIG_PATH);
    const config = getConfig();

    expect(config.NODE_ENV).toBe(TEST_NODE_ENV);
    expect(config.DATABASE_URL).toBe(TEST_DB_URL);
  });

  it('should return cached config on subsequent calls without re-validating', async () => {
    process.env.NODE_ENV = DEV_NODE_ENV;
    process.env.DATABASE_URL = FIRST_CACHE_DB_URL;

    const { getConfig } = await import(CONFIG_PATH);

    // First call - validates and caches
    const config1 = getConfig();
    expect(config1.DATABASE_URL).toBe(FIRST_CACHE_DB_URL);

    // Modify env var AFTER first call
    process.env.DATABASE_URL = SECOND_CACHE_DB_URL;

    // Second call - should return cached value
    const config2 = getConfig();
    expect(config2.DATABASE_URL).toBe(FIRST_CACHE_DB_URL);
  });
});
