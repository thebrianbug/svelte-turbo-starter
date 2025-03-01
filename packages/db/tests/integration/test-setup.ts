import { config } from 'dotenv';

// Load environment variables
config();

// Ensure required environment variables are set
const requiredEnvVars = ['DATABASE_URL'];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(
    `Missing required environment variables for integration tests: ${missingEnvVars.join(', ')}`
  );
}

// Set test-specific environment variables
process.env.NODE_ENV = 'test';
