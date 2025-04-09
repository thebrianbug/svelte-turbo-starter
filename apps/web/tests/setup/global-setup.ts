/**
 * Playwright global setup file
 *
 * This file is executed once before all tests run.
 * It initializes the test database connection and runs migrations.
 */
import { initializeTestDatabase } from '@repo/test-utils';

async function globalSetup() {
  console.log('🔧 Running Playwright global setup...');
  await initializeTestDatabase();
  console.log('✅ Test database initialized successfully');
}

export default globalSetup;
