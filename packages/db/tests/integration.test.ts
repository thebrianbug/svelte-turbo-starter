import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { db, userQueries, type NewUser, checkDatabaseConnection, users, migrationClient, queryClient } from '../index';

describe('Database Integration Tests', () => {
  // Ensure database is connected before running tests
  beforeAll(async () => {
    const isConnected = await checkDatabaseConnection();
    expect(isConnected).toBe(true);
  });

  // Clean up test data before each test
  beforeEach(async () => {
    await db.delete(users).execute();
  });

  // Clean up and close all connections after tests
  afterAll(async () => {
    await db.delete(users).execute();
    await Promise.all([
      migrationClient.end(),
      queryClient.end()
    ]);
  });

  describe('User Operations', () => {
    const testUser: NewUser = {
      name: 'Test User',
      email: 'test@example.com',
      status: 'active'
    };

    it('should create a new user', async () => {
      const user = await userQueries.create(testUser);
      expect(user).toBeDefined();
      expect(user.name).toBe(testUser.name);
      expect(user.email).toBe(testUser.email);
      expect(user.status).toBe('active');
      expect(user.id).toBeDefined();
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
    });

    it('should find user by id', async () => {
      const created = await userQueries.create(testUser);
      const found = await userQueries.findById(created.id);
      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
    });

    it('should find user by email', async () => {
      await userQueries.create(testUser);
      const found = await userQueries.findByEmail(testUser.email);
      expect(found).toBeDefined();
      expect(found?.email).toBe(testUser.email);
    });

    it('should update user', async () => {
      const created = await userQueries.create(testUser);
      const updatedName = 'Updated Name';
      const updated = await userQueries.update(created.id, { name: updatedName });
      expect(updated).toBeDefined();
      expect(updated?.name).toBe(updatedName);
      expect(updated?.updatedAt).not.toBe(created.updatedAt);
    });

    it('should soft delete user', async () => {
      const created = await userQueries.create(testUser);
      const deleted = await userQueries.delete(created.id);
      expect(deleted).toBe(true);

      const found = await userQueries.findById(created.id);
      expect(found?.status).toBe('inactive');
    });

    it('should find only active users', async () => {
      // Create two users, one active and one inactive
      const activeUser = await userQueries.create(testUser);
      const inactiveUser = await userQueries.create({
        ...testUser,
        email: 'inactive@example.com'
      });
      await userQueries.delete(inactiveUser.id);

      const activeUsers = await userQueries.findActive();
      expect(activeUsers).toHaveLength(1);
      expect(activeUsers[0].id).toBe(activeUser.id);
    });
  });

  describe('Error Handling', () => {
    it('should handle duplicate email error', async () => {
      const testUser: NewUser = {
        name: 'Test User',
        email: 'duplicate@example.com',
        status: 'active'
      };

      await userQueries.create(testUser);
      
      await expect(userQueries.create(testUser)).rejects.toThrow('Database operation failed');
    });

    it('should handle user not found', async () => {
      const nonExistentId = 99999;
      const result = await userQueries.findById(nonExistentId);
      expect(result).toBeUndefined();
    });
  });
});
