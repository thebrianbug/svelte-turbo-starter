import 'dotenv/config';

// Type-safe environment variable checking
const REQUIRED_ENV_VARS = ['DATABASE_URL', 'PGUSER', 'PGPASSWORD'] as const;

// Log all environment variables for debugging
console.log('Environment variables state:');
console.log('- DATABASE_URL:', process.env.DATABASE_URL);
if (process.env.DATABASE_URL) {
  console.log(
    '  - Starts with postgresql://?',
    process.env.DATABASE_URL.startsWith('postgresql://')
  );
  try {
    const url = new URL(process.env.DATABASE_URL);
    console.log('  - Can be parsed as URL:', true);
    console.log('  - Host:', url.hostname);
    console.log('  - Username:', url.username);
    console.log('  - Database:', url.pathname.slice(1));
  } catch (e) {
    console.log('  - Can be parsed as URL:', false);
    console.log('  - Parse error:', e instanceof Error ? e.message : String(e));
  }
}
console.log('- PGUSER:', process.env.PGUSER);
console.log('- PGPASSWORD:', process.env.PGPASSWORD ? '[present]' : '[missing]');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- CI:', process.env.CI);

// Check required environment variables
for (const name of REQUIRED_ENV_VARS) {
  // We're using a const array of strings, so this is safe
  // eslint-disable-next-line security/detect-object-injection
  if (!process.env[name]) {
    console.error('Missing required environment variable:', name);
    console.error('Available environment variables:', Object.keys(process.env).sort());
    console.error('Current environment:');
    console.error('- CI:', process.env.CI);
    console.error('- NODE_ENV:', process.env.NODE_ENV);
    console.error('- DATABASE_URL:', process.env.DATABASE_URL);
    console.error('- PGUSER:', process.env.PGUSER);
    console.error('- PGPASSWORD:', process.env.PGPASSWORD);
    throw new Error(`Missing required environment variable: ${name}`);
  }
}

// Ensure we're in test environment
if (process.env.NODE_ENV !== 'test') {
  console.warn('NODE_ENV is not "test", setting it now');
  process.env.NODE_ENV = 'test';
}
