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
// Make URL resolution dynamic by using a getter
export const databaseConfig: DatabaseConfig = {
  get url() {
    return process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/svelte_turbo_db';
  },
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
