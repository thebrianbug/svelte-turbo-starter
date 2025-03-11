import { describe, it, expect, beforeEach, afterAll, beforeAll } from 'vitest';

import { DatabaseError } from '@repo/shared';
import {
  createTestContext,
  createMigratedTestContext,
  cleanTable,
  closeTestConnection
} from '../../test-utils/database';
import { SCHEMA_OBJECTS } from '../../test-utils/database-migrations';
import { ErrorAssertions } from '../../test-utils/test-assertions';

import type { NewUser, ValidatedUpdateUser } from '../../../../src/domains/users/models/user';
import type { IUserRepository } from '../../../../src/domains/users';

const TEST_EMAILS = {
  MAIN: 'test@example.com',
  SECONDARY: 'test2@example.com',
  THIRD: 'test3@example.com',
  INACTIVE: 'inactive@example.com'
} as const;

const TEST_NAMES = {
  UPDATED: 'Updated Name',
  SECOND_USER: 'Test User 2',
  THIRD_USER: 'Test User 3'
} as const;

describe('User Integration Tests', () => {
  let testCtx: ReturnType<typeof createTestContext>;
  let userRepository: IUserRepository;

  // Initialize database with migrations before all tests
  beforeAll(async () => {
    // Ensure database schema is properly initialized with migrations
    await createMigratedTestContext();
  });

  beforeEach(async () => {
    testCtx = createTestContext();
    // Use the test repository from the test context
    userRepository = testCtx.repositories.users;
    await cleanTable(SCHEMA_OBJECTS.USERS, testCtx.db);
  });

  afterAll(async () => {
    await closeTestConnection();
  });

  const testUser: NewUser = {
    name: 'Test User',
    email: TEST_EMAILS.MAIN,
    status: 'active'
  };

  describe('findByEmail', () => {
    it('should find a user by email', async () => {
      const created = await userRepository.create(testUser);
      const found = await userRepository.findByEmail(testUser.email);
      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.email).toBe(testUser.email.toLowerCase());
    });

    it('should normalize email before searching', async () => {
      const created = await userRepository.create(testUser);
      const found = await userRepository.findByEmail('  ' + testUser.email.toUpperCase() + '  ');
      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
    });

    it('should return undefined for non-existent email', async () => {
      const found = await userRepository.findByEmail('nonexistent@example.com');
      expect(found).toBeUndefined();
    });
  });

  describe('User Lifecycle', () => {
    it('should handle not found cases properly', async () => {
      // findById should return undefined for non-existent id
      const notFound = await userRepository.findById(999999);
      expect(notFound).toBeUndefined();

      // update should throw NOT_FOUND for non-existent id
      await ErrorAssertions.assertNotFound(() =>
        userRepository.update(999999, { name: 'New Name' } as ValidatedUpdateUser)
      );

      // delete should return false for non-existent id
      const notDeleted = await userRepository.delete(999999);
      expect(notDeleted).toBe(false);
    });

    it('should handle complete user lifecycle (create, read, update, delete)', async () => {
      // Create
      const created = await userRepository.create(testUser);
      expect(created).toBeDefined();
      expect(created.name).toBe(testUser.name);
      expect(created.email).toBe(testUser.email);
      expect(created.status).toBe('active');
      expect(created.id).toBeDefined();
      expect(created.createdAt).toBeDefined();
      expect(created.updatedAt).toBeDefined();

      // Read
      const foundById = await userRepository.findById(created.id);
      expect(foundById).toBeDefined();
      expect(foundById?.id).toBe(created.id);

      // Update non-existent should throw NOT_FOUND
      await ErrorAssertions.assertNotFound(() =>
        userRepository.update(999999, { name: TEST_NAMES.UPDATED } as ValidatedUpdateUser)
      );

      const foundByEmail = await userRepository.findByEmail(testUser.email);
      expect(foundByEmail).toBeDefined();
      expect(foundByEmail?.email).toBe(testUser.email);

      // Update
      const updated = await userRepository.update(created.id, { name: TEST_NAMES.UPDATED });
      expect(updated).toBeDefined();
      expect(updated?.name).toBe(TEST_NAMES.UPDATED);
      expect(updated?.updatedAt).not.toBe(created.updatedAt);

      // Hard Delete
      const deleted = await userRepository.delete(created.id);
      expect(deleted).toBe(true);

      const foundAfterDelete = await userRepository.findById(created.id);
      expect(foundAfterDelete).toBeUndefined();
    });
  });

  describe('User Status Management', () => {
    it('should manage active and inactive users correctly', async () => {
      const activeUser = await userRepository.create(testUser);
      const inactiveUser = await userRepository.create({
        ...testUser,
        email: TEST_EMAILS.INACTIVE,
        status: 'active' as const
      });
      await userRepository.softDelete(inactiveUser.id);

      const activeUsers = await userRepository.findActive();
      expect(activeUsers).toHaveLength(1);
      expect(activeUsers[0].id).toBe(activeUser.id);
    });
  });

  describe('Database Constraints', () => {
    it('should enforce unique email constraint', async () => {
      await userRepository.create(testUser);

      // Use the error assertion utility
      await ErrorAssertions.assertUniqueViolation(() => userRepository.create(testUser));

      // Additional metadata checks if needed
      const error = await userRepository.create(testUser).catch((e) => e);
      expect(error.metadata?.operation).toBe('create');
      expect(error.metadata?.entityType).toBe('user');
    });

    it('should validate user input', async () => {
      const invalidUser = {
        ...testUser,
        email: 'invalid-email'
      };

      // Use the error assertion utility
      await ErrorAssertions.assertValidationFailed(
        () => userRepository.create(invalidUser),
        'email'
      );

      // Additional metadata checks if needed
      const error = await userRepository.create(invalidUser).catch((e) => e);
      expect(error.metadata?.entityType).toBe('user');
    });

    it('should validate name length', async () => {
      const emptyNameUser = { ...testUser, name: '' };
      const longNameUser = { ...testUser, name: 'a'.repeat(101) };

      // Use the error assertion utility for empty name
      await ErrorAssertions.assertValidationFailed(
        () => userRepository.create(emptyNameUser),
        'name'
      );

      // Use the error assertion utility for long name
      await ErrorAssertions.assertValidationFailed(
        () => userRepository.create(longNameUser),
        'name'
      );

      // Additional metadata checks if needed
      const error = await userRepository.create(emptyNameUser).catch((e) => e);
      expect(error.metadata?.entityType).toBe('user');
    });
  });

  describe('Bulk Operations', () => {
    it('should find all users', async () => {
      // Create multiple users
      const users: NewUser[] = [
        testUser,
        {
          ...testUser,
          email: TEST_EMAILS.SECONDARY,
          name: TEST_NAMES.SECOND_USER,
          status: 'active' as const
        },
        {
          ...testUser,
          email: TEST_EMAILS.THIRD,
          name: TEST_NAMES.THIRD_USER,
          status: 'active' as const
        }
      ];
      await userRepository.createMany(users);

      // Find all users
      const allUsers = await userRepository.findAll();
      expect(allUsers).toHaveLength(3);
      expect(allUsers.map((user) => user.email).sort()).toEqual(
        [TEST_EMAILS.MAIN, TEST_EMAILS.SECONDARY, TEST_EMAILS.THIRD].sort()
      );
      allUsers.forEach((user) => {
        expect(user.id).toBeDefined();
        expect(user.createdAt).toBeDefined();
        expect(user.updatedAt).toBeDefined();
        expect(user.status).toBe('active');
      });
    });

    it('should create multiple users', async () => {
      const users: NewUser[] = [
        testUser,
        {
          ...testUser,
          email: TEST_EMAILS.SECONDARY,
          name: TEST_NAMES.SECOND_USER,
          status: 'active' as const
        },
        {
          ...testUser,
          email: TEST_EMAILS.THIRD,
          name: TEST_NAMES.THIRD_USER,
          status: 'active' as const
        }
      ];

      const created = await userRepository.createMany(users);
      expect(created).toHaveLength(3);
      expect(created[0].email).toBe(testUser.email);
      expect(created[1].email).toBe(TEST_EMAILS.SECONDARY);
      expect(created[2].email).toBe(TEST_EMAILS.THIRD);
    });

    it('should handle empty array in createMany', async () => {
      const created = await userRepository.createMany([]);
      expect(created).toHaveLength(0);
    });

    it('should update multiple users by status', async () => {
      await userRepository.create(testUser);
      await userRepository.create({
        ...testUser,
        email: TEST_EMAILS.SECONDARY,
        status: 'active' as const
      });

      const updateCount = await userRepository.updateMany(
        { status: 'active' },
        { name: TEST_NAMES.UPDATED }
      );

      expect(updateCount).toBe(2);

      const activeUsers = await userRepository.findActive();
      expect(activeUsers).toHaveLength(2);
      activeUsers.forEach((user) => {
        expect(user.name).toBe(TEST_NAMES.UPDATED);
      });
    });

    it('should delete multiple users by status', async () => {
      await userRepository.create(testUser);
      await userRepository.create({
        ...testUser,
        email: TEST_EMAILS.SECONDARY,
        status: 'active' as const
      });

      const deleteCount = await userRepository.softDeleteMany({ status: 'active' });
      expect(deleteCount).toBe(2);

      const activeUsers = await userRepository.findActive();
      expect(activeUsers).toHaveLength(0);
    });
  });

  describe('Count Operations', () => {
    it('should count all users', async () => {
      await userRepository.create(testUser);
      await userRepository.create({
        ...testUser,
        email: 'test2@example.com',
        status: 'active' as const
      });

      const totalCount = await userRepository.count();
      expect(totalCount).toBe(2);
    });

    it('should count users by status', async () => {
      await userRepository.create(testUser);
      const inactiveUser = await userRepository.create({
        ...testUser,
        email: TEST_EMAILS.INACTIVE,
        status: 'active' as const
      });
      await userRepository.softDelete(inactiveUser.id);

      const activeCount = await userRepository.count({ status: 'active' });
      expect(activeCount).toBe(1);

      const inactiveCount = await userRepository.count({ status: 'inactive' });
      expect(inactiveCount).toBe(1);
    });
  });

  describe('Transaction Operations', () => {
    it('should successfully execute multiple operations in a transaction', async () => {
      const result = await userRepository.withTransaction(async (tx) => {
        const user1 = await userRepository.create(
          {
            ...testUser,
            email: TEST_EMAILS.MAIN
          },
          tx
        );

        const user2 = await userRepository.create(
          {
            ...testUser,
            email: TEST_EMAILS.SECONDARY
          },
          tx
        );

        await userRepository.update(user1.id, { name: TEST_NAMES.UPDATED }, tx);

        return { user1Id: user1.id, user2Id: user2.id };
      });

      // Verify operations were successful
      const updatedUser1 = await userRepository.findById(result.user1Id);
      const user2 = await userRepository.findById(result.user2Id);

      expect(updatedUser1?.name).toBe(TEST_NAMES.UPDATED);
      expect(user2?.email).toBe(TEST_EMAILS.SECONDARY);
    });

    it('should rollback transaction on error', async () => {
      const initialCount = await userRepository.count();

      // Attempt operations that will fail
      const error = await userRepository
        .withTransaction(async (tx) => {
          // First operation succeeds
          await userRepository.create(
            {
              ...testUser,
              email: TEST_EMAILS.MAIN
            },
            tx
          );

          // Second operation fails (duplicate email)
          await userRepository.create(
            {
              ...testUser,
              email: TEST_EMAILS.MAIN // Same email to trigger unique constraint
            },
            tx
          );
        })
        .catch((e) => e);

      // Verify transaction was rolled back
      const finalCount = await userRepository.count();
      expect(finalCount).toBe(initialCount);
      expect(error).toBeInstanceOf(DatabaseError);
      expect(error.code).toBe('UNIQUE_VIOLATION');
      expect(error.metadata?.operation).toBe('create');
      expect(error.metadata?.entityType).toBe('user');
    });
  });
});
