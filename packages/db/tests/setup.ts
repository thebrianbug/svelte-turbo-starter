import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db, migrationClient, queryClient } from '../index';

export async function setup(): Promise<void> {
  try {
    // Run migrations to ensure database schema is up to date
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

export async function teardown(): Promise<void> {
  try {
    // Close all database connections
    await Promise.all([
      migrationClient.end({ timeout: 5 }),
      queryClient.end({ timeout: 5 })
    ]);
    console.log('Database connections closed successfully');
  } catch (error) {
    console.error('Error closing database connections:', error);
    throw error;
  }
}
