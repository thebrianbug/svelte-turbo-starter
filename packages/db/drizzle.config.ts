import type { Config } from 'drizzle-kit';

// Get database credentials, handling both DATABASE_URL and individual credential env vars
const getDbCredentials = () => {
  // If we have a valid DATABASE_URL that starts with postgresql://, parse it
  if (process.env.DATABASE_URL?.startsWith('postgresql://')) {
    const dbUrl = new URL(process.env.DATABASE_URL);
    return {
      host: dbUrl.hostname,
      user: dbUrl.username,
      password: dbUrl.password,
      database: dbUrl.pathname.slice(1), // Remove leading '/'
      port: Number(dbUrl.port) || 5432
    };
  }

  // If we have PGUSER and PGPASSWORD, use those
  if (process.env.PGUSER && process.env.PGPASSWORD) {
    return {
      host: 'localhost',
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.NODE_ENV === 'test' ? 'svelte_turbo_test_db' : 'svelte_turbo_db',
      port: 5432
    };
  }

  // Fall back to default credentials
  return {
    host: process.env.DATABASE_HOST || 'localhost',
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'svelte_turbo_db',
    port: Number(process.env.DATABASE_PORT) || 5432
  };
};

const dbCredentials = getDbCredentials();

export default {
  schema: './src/domains/users/schema/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials
} satisfies Config;
