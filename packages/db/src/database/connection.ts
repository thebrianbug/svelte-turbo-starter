import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { databaseConfig } from '../config/database';
import * as schema from '../models';
import { DatabaseError, DatabaseErrorCode } from '../config/operations';

// Structured logging utility
export const log = {
  info: (message: string, meta?: Record<string, unknown>) => {
    console.log(
      JSON.stringify({ level: 'info', message, timestamp: new Date().toISOString(), ...meta })
    );
  },
  error: (message: string, error?: unknown, meta?: Record<string, unknown>) => {
    console.error(
      JSON.stringify({
        level: 'error',
        message,
        timestamp: new Date().toISOString(),
        error:
          error instanceof Error
            ? {
                name: error.name,
                message: error.message,
                stack: error.stack
              }
            : error,
        ...meta
      })
    );
  }
};

// Connection for migrations with enhanced error handling
export const migrationClient = postgres(databaseConfig.url, {
  max: databaseConfig.migration.max,
  idle_timeout: databaseConfig.migration.idleTimeout,
  max_lifetime: databaseConfig.migration.maxLifetime,
  connection: {
    application_name: 'db_migration_client'
  },
  onnotice: (notice) => {
    log.info('Migration notice', { notice });
  },
  onparameter: (parameterStatus) => {
    log.info('Migration parameter status changed', { parameterStatus });
  },
  debug: (connection_id, query, params) => {
    log.info('Migration query debug', { connection_id, query, params });
  }
});

// Connection for queries with optimized pooling and monitoring
export const queryClient = postgres(databaseConfig.url, {
  max: databaseConfig.pool.max,
  idle_timeout: databaseConfig.pool.idleTimeout,
  max_lifetime: databaseConfig.pool.maxLifetime,
  connect_timeout: databaseConfig.pool.connectTimeout,
  connection: {
    application_name: 'db_query_client'
  },
  onnotice: (notice) => {
    log.info('Query notice', { notice });
  },
  onparameter: (parameterStatus) => {
    log.info('Query parameter status changed', { parameterStatus });
  },
  debug: (connection_id, query, params) => {
    log.info('Query debug', { connection_id, query, params });
  },
  transform: {
    undefined: null // Convert undefined to null for better PostgreSQL compatibility
  }
});

// Initialize drizzle with schema and query logging
export const db = drizzle(queryClient, {
  schema,
  logger: true
});

/**
 * Safely redacts sensitive information from database URLs
 */
function redactDatabaseUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    if (urlObj.password) {
      urlObj.password = '***';
    }
    return urlObj.toString();
  } catch {
    return 'Invalid URL format';
  }
}

/**
 * Health check utility for database connection with enhanced error reporting
 * @returns Promise<boolean> true if connection is healthy, false otherwise
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const startTime = Date.now();
    await queryClient`SELECT 1`;
    const duration = Date.now() - startTime;

    log.info('Database health check successful', { duration });
    return true;
  } catch (error) {
    log.error('Database health check failed', error, {
      config: {
        url: redactDatabaseUrl(databaseConfig.url),
        pool: databaseConfig.pool
      }
    });
    return false;
  }
}

// Export connection metrics for monitoring
export function getConnectionMetrics() {
  return {
    queryPool: {
      totalConnections: queryClient.options.max,
      idleTimeout: queryClient.options.idle_timeout,
      maxLifetime: queryClient.options.max_lifetime
    },
    migrationPool: {
      totalConnections: migrationClient.options.max,
      idleTimeout: migrationClient.options.idle_timeout,
      maxLifetime: migrationClient.options.max_lifetime
    }
  };
}
