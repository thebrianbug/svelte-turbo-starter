import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { cleanTable, teardown, TABLES } from '../../test-utils/database';
import { createTestUserService } from '../../test-utils/factory';
import { DuplicateEntityError } from '@repo/shared';

const TEST_DATA = {
  EMAIL: 'test-integration@example.com',
  DUPLICATE_EMAIL: 'duplicate@example.com',
  NAME: 'Integration Test User',
  UPDATED_NAME: 'Updated Integration User'
} as const;

describe('UserService Integration Tests', () => {
  const userService = createTestUserService();

  beforeEach(async () => {
    await cleanTable(TABLES.USERS);
  });

  afterAll(async () => {
    await teardown();
  });

  describe('User Lifecycle', () => {
    it('should handle complete user lifecycle (create, read, update, deactivate)', async () => {
      // Create
      const userData = {
        email: TEST_DATA.EMAIL,
        name: TEST_DATA.NAME
      };

      const createdUser = await userService.createUser(userData);
      expect(createdUser).toBeDefined();
      expect(createdUser.email).toBe(userData.email);
      expect(createdUser.name).toBe(userData.name);
      expect(createdUser.status).toBe('active');
      expect(createdUser.id).toBeDefined();

      // Read
      const foundUser = await userService.getUserById(createdUser.id);
      expect(foundUser).toEqual(createdUser);

      // Update
      const updatedUser = await userService.updateUser(createdUser.id, {
        name: TEST_DATA.UPDATED_NAME
      });
      expect(updatedUser.name).toBe(TEST_DATA.UPDATED_NAME);
      expect(updatedUser.id).toBe(createdUser.id);

      // Deactivate
      await userService.deactivateUser(createdUser.id);
      const activeUsers = await userService.getActiveUsers();
      expect(activeUsers.find((u) => u.id === createdUser.id)).toBeUndefined();
    });

    it('should detect duplicate users correctly', async () => {
      // Create first user
      await userService.createUser({
        email: TEST_DATA.DUPLICATE_EMAIL,
        name: TEST_DATA.NAME
      });

      // Try to create duplicate
      await expect(
        userService.createUser({
          email: TEST_DATA.DUPLICATE_EMAIL,
          name: 'Different Name'
        })
      ).rejects.toThrow(DuplicateEntityError);
    });
  });

  describe('Business Rules', () => {
    it('should enforce email validation', async () => {
      await expect(
        userService.createUser({
          email: 'invalid-email',
          name: TEST_DATA.NAME
        })
      ).rejects.toThrow();
    });

    it('should enforce name validation', async () => {
      await expect(
        userService.createUser({
          email: 'valid@example.com',
          name: ''
        })
      ).rejects.toThrow();
    });
  });
});
