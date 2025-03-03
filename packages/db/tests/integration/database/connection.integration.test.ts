import postgres from 'postgres';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import { checkDatabaseConnection, getDatabaseConfig } from '../../../src/database';
import { setup, teardown } from '../test-utils/database';

const databaseUrl = getDatabaseConfig();

describe('Database Connection', () => {
  // Setup database before all tests
  beforeAll(async () => {
    await setup({
      timeout: 10,
      migrationsPath: './drizzle'
    });
  });

  // Clean up and close all connections after tests
  afterAll(async () => {
    await teardown({ timeout: 10 });
  });

  it('should successfully connect to database', async () => {
    const isConnected = await checkDatabaseConnection();
    expect(isConnected).toBe(true);
  });

  it('should handle connection timeout', async () => {
    let timeoutClient: postgres.Sql | null = null;
    try {
      // Create a new client with a very short timeout
      timeoutClient = postgres(databaseUrl, {
        connect_timeout: 0.001, // 1ms timeout for testing
        max: 1,
        idle_timeout: 0
      });

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
      invalidClient = postgres('postgresql://invalid:invalid@localhost:5432/invalid_db', {
        max: 1,
        idle_timeout: 0
      });

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
    const concurrentChecks = Array(5) // Use a reasonable default number of connections
      .fill(null)
      .map(async () => checkDatabaseConnection());

    const results = await Promise.all(concurrentChecks);
    expect(results.every((result) => result === true)).toBe(true);
  });
});
