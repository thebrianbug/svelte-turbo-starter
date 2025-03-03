import { config } from 'dotenv';

// Load environment variables
config();

// Type-safe environment variable checking
const ENV_VARS = {
  DATABASE_URL: 'DATABASE_URL'
} as const;

type EnvVar = keyof typeof ENV_VARS;

function checkEnvVar(name: EnvVar): void {
  // We're using TypeScript with a strictly typed env var name, so this is safe
  // eslint-disable-next-line security/detect-object-injection
  if (!process.env[name]) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
}

// Check required environment variables
checkEnvVar(ENV_VARS.DATABASE_URL);

// Set test-specific environment variables
process.env.NODE_ENV = 'test';
