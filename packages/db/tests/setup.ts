import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db, migrationClient } from '../index';

export async function setup() {
  try {
    // Run migrations to ensure database schema is up to date
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

export async function teardown() {
  // Close database connections
  await migrationClient.end();
}
