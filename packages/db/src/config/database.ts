export interface DatabaseConfig {
  url: string;
  pool: {
    max: number;
  };
}

export const databaseConfig: DatabaseConfig = {
  get url() {
    return (
      process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/svelte_turbo_db'
    );
  },
  pool: {
    max: 10
  }
};
