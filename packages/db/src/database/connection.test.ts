import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { checkDatabaseConnection, queryClient } from './connection';
import postgres from 'postgres';
import { setup, teardown } from './test-setup';

describe('Database Connection', () => {
  // Setup database before all tests
  beforeAll(async () => {
    await setup({
      timeout: 30,
      migrationsPath: './drizzle'
    });
  });

  // Clean up and close all connections after tests
  afterAll(async () => {
    await teardown({ timeout: 30 });
  });

  it('should successfully connect to database', async () => {
    const isConnected = await checkDatabaseConnection();
    expect(isConnected).toBe(true);
  });

  it('should handle connection timeout', async () => {
    // Create a new client with a very short timeout
    const timeoutClient = postgres(
      'postgres://postgres:postgres@localhost:5432/svelte_turbo_db',
      { connect_timeout: 0.001 } // 1ms timeout
    );

    try {
      await timeoutClient`SELECT 1`;
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      expect(error).toBeDefined();
    } finally {
      await timeoutClient.end();
    }
  });

  it('should handle invalid credentials', async () => {
    // Create a new client with invalid credentials
    const invalidClient = postgres('postgres://invalid:invalid@localhost:5432/invalid_db');

    try {
      await invalidClient`SELECT 1`;
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      expect(error).toBeDefined();
    } finally {
      await invalidClient.end();
    }
  });

  it('should handle multiple concurrent connections', async () => {
    // Test connection pool by making multiple concurrent requests
    const concurrentChecks = Array(15).fill(null).map(() => checkDatabaseConnection());
    const results = await Promise.all(concurrentChecks);
    
    // All connections should succeed
    expect(results.every(result => result === true)).toBe(true);
  });
});
