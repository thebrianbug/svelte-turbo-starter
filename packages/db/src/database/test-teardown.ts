import { teardown as dbTeardown } from './test-setup';

/**
 * Global teardown for test suite
 * Closes all database connections with proper timeout handling
 */
export async function teardown() {
  await dbTeardown({ timeout: 5000 / 1000 }); // Convert from ms to seconds for DatabaseOptions
}
