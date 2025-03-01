export const databaseConfig = {
  get url() {
    return (
      process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/svelte_turbo_db'
    );
  },
  pool: {
    max: 10
  }
};
