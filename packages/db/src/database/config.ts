import { config } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

export const loadEnvConfigForNonTestEnv = (): void => {
  if (process.env.NODE_ENV !== 'test') {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    config({ path: join(__dirname, '../../.env') });
  }
};

export const getDatabaseConfig = (): string => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required for database connection');
  }
  return process.env.DATABASE_URL;
};
