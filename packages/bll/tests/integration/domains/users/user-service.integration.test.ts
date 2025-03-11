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
    UPDATED_NAME: 'Updated Integration User'
  } as const;

  // Test user data
  let defaultUserData: { email: string; name: string };

  beforeEach(() => {
    defaultUserData = {
      email: TEST_DATA.EMAIL,
      name: TEST_DATA.NAME
    };
  });

  describe('createUser', () => {
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
