/**
 * Playwright global teardown file
 *
 * This file is executed once after all tests have completed.
 * It closes the test database connection.
 */
import { closeTestConnection } from '@repo/test-utils';

async function globalTeardown() {
  console.log('🧹 Running Playwright global teardown...');
  await closeTestConnection();
  console.log('✅ Test database connection closed');
}

export default globalTeardown;
