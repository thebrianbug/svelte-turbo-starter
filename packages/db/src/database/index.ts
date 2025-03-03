import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from '../domains/users/schema';

export type DatabaseConfig = {
  url: string;
  pool: {
    max: number;
    timeout: number;
  };
};

export function getDatabaseConfig(): DatabaseConfig {
  const isTest = process.env.NODE_ENV === 'test';
  const defaultDb = isTest ? 'svelte_turbo_test_db' : 'svelte_turbo_db';

  // Construct URL from PGUSER/PGPASSWORD if available
  const constructUrlFromCredentials = () => {
    const user = process.env.PGUSER ?? 'postgres';
    const password = process.env.PGPASSWORD ?? 'postgres';
    return `postgresql://${user}:${password}@localhost:5432/${defaultDb}`;
  };

  // Get database URL from environment or construct from credentials
  let url = process.env.DATABASE_URL;

  // Handle masked DATABASE_URL
  if (url?.includes('***')) {
    url = constructUrlFromCredentials();
  }

  // Handle invalid or missing DATABASE_URL
  try {
    if (url) {
      new URL(url); // Validate URL format
    } else {
      url = constructUrlFromCredentials();
    }
  } catch {
    url = constructUrlFromCredentials();
  }

  // If in test environment and URL doesn't include test database, append test database name
  const finalUrl =
    isTest && !url.includes('svelte_turbo_test_db')
      ? url.replace(/\/([^/]*)$/, '/svelte_turbo_test_db')
      : url;

  return {
    url: finalUrl,
    pool: {
      max: isTest ? 3 : 10,
      timeout: isTest ? 5000 : 30000
    }
  };
}

// Get database configuration
const config = getDatabaseConfig();

// Single connection client for both queries and migrations
export const client = postgres(config.url, {
  max: config.pool.max,
  connect_timeout: config.pool.timeout / 1000, // Convert to seconds
  idle_timeout: 0,
  transform: {
    undefined: null
  }
});

// Initialize drizzle with schema and logging
export const db = drizzle(client, {
  schema,
  logger: process.env.NODE_ENV !== 'test'
});

/**
 * Health check utility for database connection
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await db.execute(sql`SELECT 1`);
    return true;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
}
