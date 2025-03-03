import 'dotenv/config';

// Only DATABASE_URL is required for database configuration
if (!process.env.DATABASE_URL) {
  console.error('Missing required DATABASE_URL environment variable');
  console.error('Available environment variables:', Object.keys(process.env).sort());
  console.error('Current environment:');
  console.error('- CI:', process.env.CI);
  console.error('- NODE_ENV:', process.env.NODE_ENV);
  console.error('- DATABASE_URL:', process.env.DATABASE_URL);
  throw new Error('Missing required DATABASE_URL environment variable');
}

// Log database configuration for debugging
console.log('Database configuration:');
console.log('- DATABASE_URL:', process.env.DATABASE_URL);
try {
  const url = new URL(process.env.DATABASE_URL);
  console.log('  - Host:', url.hostname);
  console.log('  - Username:', url.username);
  console.log('  - Database:', url.pathname.slice(1));
  console.log('  - Valid URL format:', true);
} catch (e) {
  console.log('  - Valid URL format:', false);
  console.log('  - Parse error:', e instanceof Error ? e.message : String(e));
  throw new Error('Invalid DATABASE_URL format');
}

// Log other environment variables
console.log('Environment:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- CI:', process.env.CI);

// Ensure we're in test environment
if (process.env.NODE_ENV !== 'test') {
  console.warn('NODE_ENV is not "test", setting it now');
  process.env.NODE_ENV = 'test';
}
