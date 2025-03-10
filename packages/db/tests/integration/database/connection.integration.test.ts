import postgres from 'postgres';
import { describe, it, expect, afterAll } from 'vitest';

import { checkDatabaseConnection, getDatabaseConfig } from '../../../src/database';
import { closeTestConnection } from '../test-utils/database';

const databaseUrl = getDatabaseConfig();

describe('Database Connection', () => {
  // Close shared connection after all tests
  afterAll(async () => {
    await closeTestConnection();
  });
  
  it('should successfully connect to database', async () => {
    const isConnected = await checkDatabaseConnection();
    expect(isConnected).toBe(true);
  });

  it('should handle connection timeout', async () => {
    // Create a new client with a very short timeout
    const timeoutClient = postgres(databaseUrl, {
      connect_timeout: 0.001, // 1ms timeout for testing
      max: 1,
      idle_timeout: 0
    });

    try {
      await timeoutClient`SELECT 1`;
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      expect(error).toBeDefined();
    } finally {
      await timeoutClient.end({ timeout: 5 }).catch(() => {
        // Ignore cleanup errors
      });
    }
  });

  it('should handle invalid credentials', async () => {
    // Create a new client with invalid credentials
    const invalidClient = postgres('postgresql://invalid:invalid@localhost:5432/invalid_db', {
      max: 1,
      idle_timeout: 0
    });

    try {
      await invalidClient`SELECT 1`;
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      expect(error).toBeDefined();
    } finally {
      await invalidClient.end({ timeout: 5 }).catch(() => {
        // Ignore cleanup errors
      });
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
