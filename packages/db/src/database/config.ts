import { config as dotenvConfig } from 'dotenv'; // Alias to avoid name clash
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url().min(1, 'DATABASE_URL is required')
});

export type EnvConfig = z.infer<typeof envSchema>;

let validatedConfig: EnvConfig | null = null;

/**
 * Loads, validates, and returns the environment configuration.
 * - Loads `.env` file in non-test environments if needed.
 * - Validates variables against the schema using Zod.
 * - Caches the validated config for subsequent calls.
 * - Throws an error if validation fails.
 * @returns The validated EnvConfig object.
 */
export const getConfig = (): EnvConfig => {
  if (validatedConfig) {
    return validatedConfig; // Return cached config
  }

  // Load .env file if necessary (non-test, DATABASE_URL not set)
  if (process.env.NODE_ENV !== 'test' && !process.env.DATABASE_URL) {
    try {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      // Pass override: true if you want system env vars to always win over .env
      dotenvConfig({ path: join(__dirname, '../../.env') });
    } catch (error) {
      // Optional: Log dotenv loading errors, but often okay to ignore if file doesn't exist
      console.warn('Could not load .env file:', error);
    }
  }

  // Validate environment variables
  try {
    validatedConfig = envSchema.parse(process.env);
    console.info('Environment variables validated successfully.');
    return validatedConfig;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Environment variable validation failed:', error.format());
    } else {
      console.error('An unexpected error occurred during environment variable validation:', error);
    }
    throw new Error('Invalid environment configuration. See logs above.');
  }
};
