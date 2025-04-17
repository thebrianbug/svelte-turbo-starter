import { defineConfig } from 'drizzle-kit';
import { getConfig } from './src/database/config';

// Ensure environment variables are loaded and validated *before* defineConfig reads them
// Note: Drizzle Kit CLI might still read process.env directly depending on its internal implementation.
// This approach tries to make the validated config available early.
const config = getConfig();

export default defineConfig({
  schema: './src/domains/users/schema/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    // Use the validated DATABASE_URL
    url: config.DATABASE_URL
    // If Drizzle Kit requires individual parameters, you might need to parse DATABASE_URL here
    // or adjust the config schema to include them. Prefer using the URL if possible.
  }
});
