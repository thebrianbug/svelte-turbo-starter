import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { userQueries } from './users';
import type { NewUser } from './schema';
import { setup, teardown, cleanBetweenTests } from '../database/test-setup';

describe('User Integration Tests', () => {
  // Setup database before all tests
  beforeAll(async () => {
    await setup({
      timeout: 10,
      migrationsPath: './drizzle'
    });
  });

  // Clean test data before each test
  beforeEach(async () => {
    await cleanBetweenTests();
  });

  // Clean up and close all connections after tests
  afterAll(async () => {
    await teardown({ timeout: 10 });
  });

  const testUser: NewUser = {
    name: 'Test User',
    email: 'test@example.com',
    status: 'active'
  };

  describe('User Lifecycle', () => {
    it('should handle complete user lifecycle (create, read, update, delete)', async () => {
      // Create
      const created = await userQueries.create(testUser);
      expect(created).toBeDefined();
      expect(created.name).toBe(testUser.name);
      expect(created.email).toBe(testUser.email);
      expect(created.status).toBe('active');
      expect(created.id).toBeDefined();
      expect(created.createdAt).toBeDefined();
      expect(created.updatedAt).toBeDefined();

      // Read
      const foundById = await userQueries.findById(created.id);
      expect(foundById).toBeDefined();
      expect(foundById?.id).toBe(created.id);

      const foundByEmail = await userQueries.findByEmail(testUser.email);
      expect(foundByEmail).toBeDefined();
      expect(foundByEmail?.email).toBe(testUser.email);

      // Update
      const updatedName = 'Updated Name';
      const updated = await userQueries.update(created.id, { name: updatedName });
      expect(updated).toBeDefined();
      expect(updated?.name).toBe(updatedName);
      expect(updated?.updatedAt).not.toBe(created.updatedAt);

      // Soft Delete
      const deleted = await userQueries.delete(created.id);
      expect(deleted).toBe(true);

      const foundAfterDelete = await userQueries.findById(created.id);
      expect(foundAfterDelete?.status).toBe('inactive');
    });
  });

  describe('User Status Management', () => {
    it('should manage active and inactive users correctly', async () => {
      // Create active and inactive users
      const activeUser = await userQueries.create(testUser);
      const inactiveUser = await userQueries.create({
        ...testUser,
        email: 'inactive@example.com'
      });
      await userQueries.delete(inactiveUser.id);

      // Verify active users list
      const activeUsers = await userQueries.findActive();
      expect(activeUsers).toHaveLength(1);
      expect(activeUsers[0].id).toBe(activeUser.id);
    });
  });

  describe('Database Constraints', () => {
    it('should enforce unique email constraint', async () => {
      await userQueries.create(testUser);
      await expect(userQueries.create(testUser)).rejects.toThrow('Database operation failed');
    });

    it('should handle non-existent user queries', async () => {
      const nonExistentId = 99999;
      const result = await userQueries.findById(nonExistentId);
      expect(result).toBeUndefined();
    });
  });
});
