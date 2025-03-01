/**
 * Database configuration settings
 */
export const databaseConfig = {
  url: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/test',
  pool: {
    max: 10,
    idleTimeout: 20,
    connectTimeout: 10
  },
  migrations: {
    max: 1
  }
} as const;
