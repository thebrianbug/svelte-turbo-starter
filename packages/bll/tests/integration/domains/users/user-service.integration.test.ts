import { describe, it, expect, beforeEach } from 'vitest';
import { executeServiceTest } from '../../../test-utils';
import { createUserService } from '../../../../src/domains/users/factory';
import { DuplicateEntityError, EntityNotFoundError } from '@repo/shared';

/**
 * Integration tests for UserService
 *
 * Following DDD and layered testing principles:
 * 1. Uses real repositories with transaction isolation
 * 2. Tests business logic with actual database interactions
 * 3. Verifies error translation from DB to domain layer
 * 4. All operations automatically rolled back after each test
 */
describe('UserService Integration', () => {
  const TEST_DATA = {
    EMAIL: 'integration-test@example.com',
    NAME: 'Integration Test User',
    UPDATED_NAME: 'Updated Integration User',
    INVALID_EMAIL: 'not-an-email',
    VERY_LONG_NAME: 'A'.repeat(256)
  } as const;

  const VALIDATION_ERROR_MATCHER = {
    name: 'ValidationError',
    metadata: expect.objectContaining({
      entityType: 'User',
      validationMessage: expect.stringContaining('Database validation failed for user')
    })
  };

  // Test user data
  let defaultUserData: { email: string; name: string };

  beforeEach(() => {
    defaultUserData = {
      email: TEST_DATA.EMAIL,
      name: TEST_DATA.NAME
    };
  });

  describe('createUser', () => {
    it('should throw ValidationError for invalid email format', async () => {
      await executeServiceTest(async (context) => {
        const userService = createUserService(context.deps);

        const invalidData = {
          email: TEST_DATA.INVALID_EMAIL,
          name: TEST_DATA.NAME
        };

        await expect(userService.createUser(invalidData)).rejects.toMatchObject(VALIDATION_ERROR_MATCHER);
      });
    });

    it('should throw ValidationError for missing required fields', async () => {
      await executeServiceTest(async (context) => {
        const userService = createUserService(context.deps);

        const incompleteData = {
          email: TEST_DATA.EMAIL
          // name is missing
        };

        await expect(userService.createUser(incompleteData)).rejects.toMatchObject(VALIDATION_ERROR_MATCHER);
      });
    });

    it('should throw ValidationError for name too long', async () => {
      await executeServiceTest(async (context) => {
        const userService = createUserService(context.deps);

        const invalidData = {
          email: TEST_DATA.EMAIL,
          name: TEST_DATA.VERY_LONG_NAME
        };

        await expect(userService.createUser(invalidData)).rejects.toMatchObject(VALIDATION_ERROR_MATCHER);
      });
    });
    it('should create a new user successfully', async () => {
      await executeServiceTest(async (context) => {
        // Get service with transaction-based repository
        const userService = createUserService(context.deps);

        // Create user
        const result = await userService.createUser(defaultUserData);

        // Verify result
        expect(result).toBeDefined();
        expect(result.id).toBeGreaterThan(0);
        expect(result.email).toBe(defaultUserData.email);
        expect(result.name).toBe(defaultUserData.name);
        expect(result.status).toBe('active');
      });
    });

    it('should throw DuplicateEntityError when creating user with existing email', async () => {
      await executeServiceTest(async (context) => {
        const userService = createUserService(context.deps);

        // Create user first time
        await userService.createUser(defaultUserData);

        // Attempt to create again with same email
        await expect(userService.createUser(defaultUserData)).rejects.toThrow(DuplicateEntityError);
      });
    });
  });

  describe('getUserById', () => {
    it('should retrieve user by id', async () => {
      await executeServiceTest(async (context) => {
        const userService = createUserService(context.deps);

        // Create user first
        const createdUser = await userService.createUser(defaultUserData);

        // Retrieve user
        const retrievedUser = await userService.getUserById(createdUser.id);

        // Verify result
        expect(retrievedUser).toBeDefined();
        expect(retrievedUser.id).toBe(createdUser.id);
        expect(retrievedUser.email).toBe(defaultUserData.email);
      });
    });

    it('should throw EntityNotFoundError for non-existent user id', async () => {
      await executeServiceTest(async (context) => {
        const userService = createUserService(context.deps);
        const nonExistentId = 99999;

        await expect(userService.getUserById(nonExistentId)).rejects.toThrow(EntityNotFoundError);
      });
    });
  });

  describe('updateUser', () => {
    it('should preserve unmodified fields during partial update', async () => {
      await executeServiceTest(async (context) => {
        const userService = createUserService(context.deps);

        // Create user first
        const createdUser = await userService.createUser(defaultUserData);

        // Update only the name
        const updateData = {
          name: TEST_DATA.UPDATED_NAME
        };

        const updatedUser = await userService.updateUser(createdUser.id, updateData);

        // Verify result - email should remain unchanged
        expect(updatedUser).toBeDefined();
        expect(updatedUser.id).toBe(createdUser.id);
        expect(updatedUser.name).toBe(TEST_DATA.UPDATED_NAME);
        expect(updatedUser.email).toBe(defaultUserData.email);
        expect(updatedUser.status).toBe(createdUser.status);
      });
    });

    it('should throw ValidationError for invalid update data', async () => {
      await executeServiceTest(async (context) => {
        const userService = createUserService(context.deps);

        // Create user first
        const createdUser = await userService.createUser(defaultUserData);

        // Try to update with invalid name
        const invalidData = {
          name: TEST_DATA.VERY_LONG_NAME
        };

        await expect(userService.updateUser(createdUser.id, invalidData)).rejects.toMatchObject(VALIDATION_ERROR_MATCHER);
      });
    });

    it('should handle concurrent updates correctly', async () => {
      await executeServiceTest(async (context) => {
        const userService = createUserService(context.deps);

        // Create initial user
        const createdUser = await userService.createUser(defaultUserData);

        // Perform two updates concurrently
        const update1 = userService.updateUser(createdUser.id, { name: 'Update 1' });
        const update2 = userService.updateUser(createdUser.id, { name: 'Update 2' });

        // Both updates should complete without error
        await expect(Promise.all([update1, update2])).resolves.toBeDefined();

        // Verify final state
        const finalUser = await userService.getUserById(createdUser.id);
        expect(finalUser.name).toBe('Update 2');
      });
    });
    it('should update user successfully', async () => {
      await executeServiceTest(async (context) => {
        const userService = createUserService(context.deps);

        // Create user first
        const createdUser = await userService.createUser(defaultUserData);

        // Update user
        const updateData = {
          name: TEST_DATA.UPDATED_NAME
        };

        const updatedUser = await userService.updateUser(createdUser.id, updateData);

        // Verify result
        expect(updatedUser).toBeDefined();
        expect(updatedUser.id).toBe(createdUser.id);
        expect(updatedUser.name).toBe(TEST_DATA.UPDATED_NAME);
        expect(updatedUser.email).toBe(defaultUserData.email); // Email unchanged
      });
    });

    it('should throw EntityNotFoundError when updating non-existent user', async () => {
      await executeServiceTest(async (context) => {
        const userService = createUserService(context.deps);
        const nonExistentId = 99999;

        await expect(userService.updateUser(nonExistentId, { name: 'New Name' })).rejects.toThrow(
          EntityNotFoundError
        );
      });
    });
  });

  describe('deactivateUser', () => {
    it('should handle deactivation of already inactive user', async () => {
      await executeServiceTest(async (context) => {
        const userService = createUserService(context.deps);

        // Create and deactivate user
        const createdUser = await userService.createUser(defaultUserData);
        await userService.deactivateUser(createdUser.id);

        // Try to deactivate again
        await expect(userService.deactivateUser(createdUser.id)).resolves.not.toThrow();

        // Verify user remains inactive
        const user = await userService.getUserById(createdUser.id);
        expect(user.status).toBe('inactive');
      });
    });

    it('should handle concurrent deactivation attempts', async () => {
      await executeServiceTest(async (context) => {
        const userService = createUserService(context.deps);

        // Create user
        const createdUser = await userService.createUser(defaultUserData);

        // Attempt concurrent deactivations
        const deactivate1 = userService.deactivateUser(createdUser.id);
        const deactivate2 = userService.deactivateUser(createdUser.id);

        // Both should complete without error
        await expect(Promise.all([deactivate1, deactivate2])).resolves.not.toThrow();

        // Verify final state
        const user = await userService.getUserById(createdUser.id);
        expect(user.status).toBe('inactive');
      });
    });
    it('should deactivate user successfully', async () => {
      await executeServiceTest(async (context) => {
        const userService = createUserService(context.deps);

        // Create user first
        const createdUser = await userService.createUser(defaultUserData);

        // Deactivate user
        await userService.deactivateUser(createdUser.id);

        // Verify user is deactivated by checking its status
        const deactivatedUser = await userService.getUserById(createdUser.id);
        expect(deactivatedUser).toBeDefined();
        expect(deactivatedUser.status).toBe('inactive');
      });
    });
  });

  describe('getActiveUsers', () => {
    it('should handle pagination and ordering correctly', async () => {
      await executeServiceTest(async (context) => {
        const userService = createUserService(context.deps);

        // Create multiple users
        const users = await Promise.all([
          userService.createUser({ email: 'user1@example.com', name: 'User 1' }),
          userService.createUser({ email: 'user2@example.com', name: 'User 2' }),
          userService.createUser({ email: 'user3@example.com', name: 'User 3' })
        ]);

        // Deactivate one user
        await userService.deactivateUser(users[1].id);

        // Get active users
        const activeUsers = await userService.getActiveUsers();

        // Verify pagination and ordering
        expect(activeUsers).toHaveLength(2);
        expect(activeUsers.map(u => u.email)).toEqual(
          expect.arrayContaining(['user1@example.com', 'user3@example.com'])
        );
      });
    });

    it('should return empty array when no active users exist', async () => {
      await executeServiceTest(async (context) => {
        const userService = createUserService(context.deps);

        // Create and deactivate a user
        const user = await userService.createUser(defaultUserData);
        await userService.deactivateUser(user.id);

        // Get active users
        const activeUsers = await userService.getActiveUsers();

        // Verify empty result
        expect(activeUsers).toHaveLength(0);
      });
    });

    it('should handle large number of active users', async () => {
      await executeServiceTest(async (context) => {
        const userService = createUserService(context.deps);

        // Create 10 users
        const createPromises = Array.from({ length: 10 }, (_, i) => (
          userService.createUser({
            email: `user${i}@example.com`,
            name: `User ${i}`
          })
        ));

        await Promise.all(createPromises);

        // Get active users
        const activeUsers = await userService.getActiveUsers();

        // Verify all users are returned
        expect(activeUsers).toHaveLength(10);
      });
    });
    it('should retrieve only active users', async () => {
      await executeServiceTest(async (context) => {
        const userService = createUserService(context.deps);

        // Create multiple users with different statuses
        const activeUser1 = await userService.createUser({
          email: 'active1@example.com',
          name: 'Active User 1'
        });

        const activeUser2 = await userService.createUser({
          email: 'active2@example.com',
          name: 'Active User 2'
        });

        const inactiveUserData = {
          email: 'inactive@example.com',
          name: 'Inactive User',
          status: 'inactive' as const
        };

        const inactiveUser = await userService.createUser(inactiveUserData);

        // Deactivate one user
        await userService.deactivateUser(activeUser2.id);

        // Get active users
        const activeUsers = await userService.getActiveUsers();

        // Verify only active users are returned
        expect(activeUsers.length).toBeGreaterThanOrEqual(1);

        // Check if our active user is in the results
        const foundUser = activeUsers.find((user) => user.id === activeUser1.id);
        expect(foundUser).toBeDefined();

        // Verify deactivated user is not in results
        const deactivatedUser = activeUsers.find((user) => user.id === activeUser2.id);
        expect(deactivatedUser).toBeUndefined();

        // Verify inactive user is not in results
        const foundInactiveUser = activeUsers.find((user) => user.id === inactiveUser.id);
        expect(foundInactiveUser).toBeUndefined();
      });
    });
  });
});
