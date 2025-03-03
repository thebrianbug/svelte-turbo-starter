export function getDatabaseConfig(): string {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const isTest = process.env.NODE_ENV === 'test';
  return isTest && !process.env.DATABASE_URL.includes('svelte_turbo_test_db')
    ? process.env.DATABASE_URL.replace(/\/([^/]*)$/, '/svelte_turbo_test_db')
    : process.env.DATABASE_URL;
}
