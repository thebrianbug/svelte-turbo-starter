import { vi } from 'vitest';

// Create mock functions for database operations
const mockExecute = vi.fn();
const mockValues = vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([]) });
const mockFrom = vi.fn().mockResolvedValue([]);
const mockSet = vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ execute: mockExecute }) });

// Mock the postgres client
const mockEnd = vi.fn().mockResolvedValue(undefined);
const mockQuery = vi.fn().mockResolvedValue([{ count: '0' }]);
const mockPostgresClient = vi.fn(() => {
  const client = (...args: any[]) => {
    return mockQuery(args);
  };
  client.end = mockEnd;
  return client;
});

vi.mock('postgres', () => ({
  default: mockPostgresClient
}));

// Mock drizzle
const mockDb = {
  delete: vi.fn().mockReturnValue({ execute: mockExecute }),
  insert: vi.fn().mockReturnValue({ values: mockValues }),
  select: vi.fn().mockReturnValue({ from: mockFrom }),
  update: vi.fn().mockReturnValue({ set: mockSet }),
};

vi.mock('drizzle-orm/postgres-js', () => ({
  drizzle: vi.fn().mockReturnValue(mockDb)
}));

// Mock the database config
vi.mock('../config/database', () => ({
  databaseConfig: {
    url: 'mock-url',
    pool: {
      max: 1,
      idleTimeout: 1,
      maxLifetime: 1,
      connectTimeout: 1,
    },
    migration: {
      max: 1,
      idleTimeout: 1,
      maxLifetime: 1,
    },
  },
}));

// Mock database connection module
vi.mock('../database/connection', () => {
  return {
    migrationClient: {
      end: mockEnd,
    },
    queryClient: mockQuery,
    db: mockDb,
    checkDatabaseConnection: vi.fn().mockResolvedValue(true),
  };
});
