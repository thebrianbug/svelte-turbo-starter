import type { Config } from 'drizzle-kit';

// Parse DATABASE_URL if provided
const parseDbUrl = (url: string) => {
  const dbUrl = new URL(url);
  return {
    host: dbUrl.hostname,
    user: dbUrl.username,
    password: dbUrl.password,
    database: dbUrl.pathname.slice(1), // Remove leading '/'
    port: Number(dbUrl.port) || 5432
  };
};

// Use DATABASE_URL if provided, otherwise fall back to individual credentials
const dbCredentials = process.env.DATABASE_URL
  ? parseDbUrl(process.env.DATABASE_URL)
  : {
      host: process.env.DATABASE_HOST || 'localhost',
      user: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres',
      database: process.env.DATABASE_NAME || 'svelte_turbo_db',
      port: Number(process.env.DATABASE_PORT) || 5432
    };

export default {
  schema: './src/domains/users/schema/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials
} satisfies Config;
