// Load environment variables
import { loadEnvConfigForNonTestEnv } from '../../../src/database/config';
loadEnvConfigForNonTestEnv();

// Ensure we're in test environment
process.env.NODE_ENV = 'test';

// Set up test database connection
process.env.DATABASE_URL = 'postgres://postgres:postgres@localhost:5432/svelte_turbo_test_db';
