import { sql } from 'drizzle-orm';

export * from './config';
export * from './connection';

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const { db } = await import('./connection');
    await db.execute(sql`SELECT 1`);
    return true;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
}
