import type { DatabaseConfig } from '../config/database';
import { calculateBackoffDelay, databaseConfig } from '../config/database';
import { DatabaseError, DatabaseErrorCode } from '../config/operations';
import { queryClient, migrationClient } from './connection';

interface ConnectionState {
  isConnected: boolean;
  lastError?: Error;
  reconnectAttempt: number;
  reconnectTimeout?: NodeJS.Timeout;
}

class ConnectionManager {
  private state: ConnectionState = {
    isConnected: false,
    reconnectAttempt: 0
  };

  private config: DatabaseConfig;

  constructor(config: DatabaseConfig = databaseConfig) {
    this.config = config;
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Handle graceful shutdown
    const cleanup = async () => {
      console.log('Initiating graceful shutdown...');

      // Clear any pending reconnection attempts
      if (this.state.reconnectTimeout) {
        clearTimeout(this.state.reconnectTimeout);
      }

      // Set a timeout for forceful shutdown
      const forceShutdown = setTimeout(() => {
        console.error('Forced shutdown due to timeout');
        process.exit(1);
      }, this.config.shutdown.gracePeriod);

      try {
        await Promise.race([
          Promise.all([
            queryClient.end({ timeout: this.config.shutdown.gracePeriod }),
            migrationClient.end({ timeout: this.config.shutdown.gracePeriod })
          ]),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error('Shutdown timeout')),
              this.config.shutdown.gracePeriod
            )
          )
        ]);

        console.log('Database connections closed successfully');
        clearTimeout(forceShutdown);
        process.exit(0);
      } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.once('SIGTERM', cleanup);
    process.once('SIGINT', cleanup);
  }

  /**
   * Attempts to establish database connection with retry logic
   */
  async connect(): Promise<void> {
    if (this.state.isConnected) {
      return;
    }

    try {
      await this.attemptConnection();
      this.state.isConnected = true;
      this.state.reconnectAttempt = 0;
      this.state.lastError = undefined;
      console.log('Database connection established successfully');
    } catch (error) {
      await this.handleConnectionError(error);
    }
  }

  private async attemptConnection(): Promise<void> {
    try {
      // Test connection
      await queryClient`SELECT 1`;
    } catch (error) {
      throw new DatabaseError(
        'Failed to establish database connection',
        DatabaseErrorCode.CONNECTION_ERROR,
        error
      );
    }
  }

  private async handleConnectionError(error: unknown): Promise<void> {
    this.state.isConnected = false;
    this.state.lastError = error instanceof Error ? error : new Error('Unknown error');
    this.state.reconnectAttempt++;

    console.error(
      `Database connection attempt ${this.state.reconnectAttempt} failed:`,
      this.state.lastError
    );

    if (this.state.reconnectAttempt < this.config.retry.attempts) {
      const delay = calculateBackoffDelay(this.state.reconnectAttempt, this.config.retry);
      console.log(`Retrying connection in ${delay}ms...`);

      // Schedule reconnection attempt
      this.state.reconnectTimeout = setTimeout(() => {
        void this.connect();
      }, delay);
    } else {
      console.error(
        `Failed to establish database connection after ${this.config.retry.attempts} attempts`
      );
      throw new DatabaseError(
        'Maximum connection retry attempts exceeded',
        DatabaseErrorCode.CONNECTION_ERROR,
        this.state.lastError
      );
    }
  }

  /**
   * Checks the health of the database connection
   */
  async checkHealth(): Promise<boolean> {
    try {
      await queryClient`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  /**
   * Returns current connection state
   */
  getState(): Readonly<ConnectionState> {
    return { ...this.state };
  }
}

// Export singleton instance
export const connectionManager = new ConnectionManager();
