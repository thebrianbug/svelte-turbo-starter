import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { userQueries } from './users';
import type { NewUser } from '../../schema';
import { setup, teardown, cleanBetweenTests } from '../database/test-setup';
import { DatabaseErrorCode } from '../config/operations';

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
      const error = await userQueries.create(testUser).catch((e) => e);
      expect(error.code).toBe(DatabaseErrorCode.DUPLICATE_KEY);
    });

    it('should handle non-existent user queries', async () => {
      const nonExistentId = 99999;
      await expect(userQueries.update(nonExistentId, { name: 'New Name' })).rejects.toMatchObject({
        code: DatabaseErrorCode.NOT_FOUND,
        message: 'User not found'
      });
    });

    it('should validate user input', async () => {
      const invalidUser = {
        ...testUser,
        email: 'invalid-email'
      };
      await expect(userQueries.create(invalidUser)).rejects.toMatchObject({
        code: DatabaseErrorCode.VALIDATION_ERROR,
        message: 'Invalid email format'
      });
    });

    it('should validate name length', async () => {
      const emptyNameUser = { ...testUser, name: '' };
      const longNameUser = { ...testUser, name: 'a'.repeat(101) };

      await expect(userQueries.create(emptyNameUser)).rejects.toMatchObject({
        code: DatabaseErrorCode.VALIDATION_ERROR,
        message: 'Name must be between 1 and 100 characters'
      });

      await expect(userQueries.create(longNameUser)).rejects.toMatchObject({
        code: DatabaseErrorCode.VALIDATION_ERROR,
        message: 'Name must be between 1 and 100 characters'
      });
    });
  });

  describe('Bulk Operations', () => {
    it('should create multiple users', async () => {
      const users = [
        testUser,
        { ...testUser, email: 'test2@example.com', name: 'Test User 2' },
        { ...testUser, email: 'test3@example.com', name: 'Test User 3' }
      ];

      const created = await userQueries.createMany(users);
      expect(created).toHaveLength(3);
      expect(created[0].email).toBe(testUser.email);
      expect(created[1].email).toBe('test2@example.com');
      expect(created[2].email).toBe('test3@example.com');
    });

    it('should handle empty array in createMany', async () => {
      const created = await userQueries.createMany([]);
      expect(created).toHaveLength(0);
    });

    it('should update multiple users by status', async () => {
      // Create test users
      await userQueries.create(testUser);
      await userQueries.create({ ...testUser, email: 'test2@example.com' });

      // Update all active users
      const updateCount = await userQueries.updateMany(
        { status: 'active' },
        { name: 'Updated Name' }
      );

      expect(updateCount).toBe(2);

      // Verify updates
      const activeUsers = await userQueries.findActive();
      expect(activeUsers).toHaveLength(2);
      activeUsers.forEach((user) => {
        expect(user.name).toBe('Updated Name');
      });
    });

    it('should delete multiple users by status', async () => {
      // Create test users
      await userQueries.create(testUser);
      await userQueries.create({ ...testUser, email: 'test2@example.com' });

      // Delete all active users
      const deleteCount = await userQueries.deleteMany({ status: 'active' });
      expect(deleteCount).toBe(2);

      // Verify deletions
      const activeUsers = await userQueries.findActive();
      expect(activeUsers).toHaveLength(0);
    });
  });

  describe('Count Operations', () => {
    it('should count all users', async () => {
      await userQueries.create(testUser);
      await userQueries.create({ ...testUser, email: 'test2@example.com' });

      const totalCount = await userQueries.count();
      expect(totalCount).toBe(2);
    });

    it('should count users by status', async () => {
      // Create active and inactive users
      await userQueries.create(testUser);
      const inactiveUser = await userQueries.create({ ...testUser, email: 'inactive@example.com' });
      await userQueries.delete(inactiveUser.id);

      const activeCount = await userQueries.count({ status: 'active' });
      expect(activeCount).toBe(1);

      const inactiveCount = await userQueries.count({ status: 'inactive' });
      expect(inactiveCount).toBe(1);
    });
  });

  describe('Name Transformation', () => {
    it('should properly transform names', async () => {
      const userWithSpaces = {
        ...testUser,
        name: '  Test   User  With   Spaces  '
      };

      const created = await userQueries.create(userWithSpaces);
      expect(created.name).toBe('Test User With Spaces');
    });
  });

  describe('Status Updates and Deletion Edge Cases', () => {
    it('should handle direct status updates', async () => {
      const user = await userQueries.create(testUser);

      // Direct update to inactive
      const updated = await userQueries.update(user.id, { status: 'inactive' });
      expect(updated?.status).toBe('inactive');
    });

    it('should handle deleting already inactive user', async () => {
      const user = await userQueries.create(testUser);

      // First deletion should succeed
      await userQueries.delete(user.id);

      // Second deletion should fail
      await expect(userQueries.delete(user.id)).rejects.toMatchObject({
        code: DatabaseErrorCode.NOT_FOUND,
        message: 'User not found or already inactive'
      });
    });
  });
});
