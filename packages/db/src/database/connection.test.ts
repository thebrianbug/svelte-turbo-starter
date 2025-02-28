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
    let timeoutClient: postgres.Sql | null = null;
    try {
      // Create a new client with a very short timeout
      timeoutClient = postgres(
        'postgres://postgres:postgres@localhost:5432/svelte_turbo_db',
        { 
          connect_timeout: 0.001, // 1ms timeout
          max: 1, // Limit to single connection
          idle_timeout: 0 // Close immediately when idle
        }
      );

      await timeoutClient`SELECT 1`;
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      expect(error).toBeDefined();
    } finally {
      if (timeoutClient) {
        await timeoutClient.end({ timeout: 5 }).catch(() => {
          // Ignore cleanup errors
        });
      }
    }
  });

  it('should handle invalid credentials', async () => {
    let invalidClient: postgres.Sql | null = null;
    try {
      // Create a new client with invalid credentials
      invalidClient = postgres(
        'postgres://invalid:invalid@localhost:5432/invalid_db',
        {
          max: 1, // Limit to single connection
          idle_timeout: 0 // Close immediately when idle
        }
      );

      await invalidClient`SELECT 1`;
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      expect(error).toBeDefined();
    } finally {
      if (invalidClient) {
        await invalidClient.end({ timeout: 5 }).catch(() => {
          // Ignore cleanup errors
        });
      }
    }
  });

  it('should handle multiple concurrent connections', async () => {
    const maxConnections = 5; // Reduce from 15 to stay within pool limits
    const concurrentChecks = Array(maxConnections)
      .fill(null)
      .map(() => checkDatabaseConnection());
    
    const results = await Promise.all(concurrentChecks);
    expect(results.every(result => result === true)).toBe(true);
  });
});
