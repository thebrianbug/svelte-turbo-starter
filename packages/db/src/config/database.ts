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
  retry: {
    attempts: number;
    initialDelay: number;
    maxDelay: number;
    factor: number;
  };
  shutdown: {
    gracePeriod: number;
  };
}

// Default configuration with more reasonable timeouts and retry settings
// Make URL resolution dynamic by using a getter
export const databaseConfig: DatabaseConfig = {
  get url() {
    return (
      process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/svelte_turbo_db'
    );
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
  },
  retry: {
    attempts: 5,
    initialDelay: 100, // ms
    maxDelay: 5000, // ms
    factor: 2 // exponential backoff factor
  },
  shutdown: {
    gracePeriod: 10000 // ms
  }
};

/**
 * Calculate exponential backoff delay
 * @param attempt Current attempt number (1-based)
 * @param config Retry configuration
 * @returns Delay in milliseconds
 */
export function calculateBackoffDelay(attempt: number, config: DatabaseConfig['retry']): number {
  const delay = Math.min(
    config.maxDelay,
    config.initialDelay * Math.pow(config.factor, attempt - 1)
  );
  // Add jitter to prevent thundering herd
  return delay * (0.75 + Math.random() * 0.5);
}
