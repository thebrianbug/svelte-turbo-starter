export interface DatabaseConfig {
  url: string;
  pool: {
    max: number;
    idleTimeout: number;
    maxLifetime: number;
    connectTimeout: number;
  };
  migration: {
    max: number;
    idleTimeout: number;
    maxLifetime: number;
  };
}

// Default configuration with more reasonable timeouts
export const databaseConfig: DatabaseConfig = {
  url: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/postgres',
  pool: {
    max: 10,
    idleTimeout: 20,
    maxLifetime: 60,
    connectTimeout: 5
  },
  migration: {
    max: 1,
    idleTimeout: 5,
    maxLifetime: 15
  }
};
