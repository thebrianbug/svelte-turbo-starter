import { describe, it, expect, beforeEach, afterAll, beforeAll } from 'vitest';

import { DatabaseError } from '@repo/shared';
import {
  createTestContext,
  createMigratedTestContext,
  cleanTable,
  closeTestConnection,
  withTransactionTest,
  createTransactionTestContext
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

  // Initialize database with migrations before all tests
  beforeAll(async () => {
    // Ensure database schema is properly initialized with migrations
    await createMigratedTestContext();
  });

  beforeEach(async () => {
    testCtx = createTestContext();
    await cleanTable(SCHEMA_OBJECTS.USERS, testCtx.db);
  });

  afterAll(async () => {
    await closeTestConnection();
  });

  // Helper function that uses the shared withTransactionTest with the user repository
  function withUserTransactionTest(
    testFn: (repo: IUserRepository) => Promise<void>
  ): Promise<void> {
    return withTransactionTest(
      testFn,
      (tx) => createTransactionTestContext(tx).repositories.users,
      testCtx.db
    );
  }

  const testUser: NewUser = {
    name: 'Test User',
    email: TEST_EMAILS.MAIN,
    status: 'active'
  };

  describe('findByEmail', () => {
    it('should find a user by email', async () => {
      await withUserTransactionTest(async (transactionRepo) => {
        const created = await transactionRepo.create(testUser);
        const found = await transactionRepo.findByEmail(testUser.email);
        expect(found).toBeDefined();
        expect(found?.id).toBe(created.id);
        expect(found?.email).toBe(testUser.email.toLowerCase());
      });
    });

    it('should normalize email before searching', async () => {
      await withUserTransactionTest(async (transactionRepo) => {
        const created = await transactionRepo.create(testUser);
        const found = await transactionRepo.findByEmail('  ' + testUser.email.toUpperCase() + '  ');
        expect(found).toBeDefined();
        expect(found?.id).toBe(created.id);
      });
    });

    it('should return undefined for non-existent email', async () => {
      await withUserTransactionTest(async (transactionRepo) => {
        const found = await transactionRepo.findByEmail('nonexistent@example.com');
        expect(found).toBeUndefined();
      });
    });
  });

  describe('User Lifecycle', () => {
    it('should handle not found cases properly', async () => {
      await withUserTransactionTest(async (transactionRepo) => {
        // findById should return undefined for non-existent id
        const notFound = await transactionRepo.findById(999999);
        expect(notFound).toBeUndefined();

        // update should throw NOT_FOUND for non-existent id
        await ErrorAssertions.assertNotFound(() =>
          transactionRepo.update(999999, { name: 'New Name' } as ValidatedUpdateUser)
        );

        // delete should return false for non-existent id
        const notDeleted = await transactionRepo.delete(999999);
        expect(notDeleted).toBe(false);
      });
    });

    it('should handle complete user lifecycle (create, read, update, delete)', async () => {
      await withUserTransactionTest(async (transactionRepo) => {
        // Create
        const created = await transactionRepo.create(testUser);
        expect(created).toBeDefined();
        expect(created.name).toBe(testUser.name);
        expect(created.email).toBe(testUser.email);
        expect(created.status).toBe('active');
        expect(created.id).toBeDefined();
        expect(created.createdAt).toBeDefined();
        expect(created.updatedAt).toBeDefined();

        // Read
        const foundById = await transactionRepo.findById(created.id);
        expect(foundById).toBeDefined();
        expect(foundById?.id).toBe(created.id);

        // Update non-existent should throw NOT_FOUND
        await ErrorAssertions.assertNotFound(() =>
          transactionRepo.update(999999, { name: TEST_NAMES.UPDATED } as ValidatedUpdateUser)
        );

        const foundByEmail = await transactionRepo.findByEmail(testUser.email);
        expect(foundByEmail).toBeDefined();
        expect(foundByEmail?.email).toBe(testUser.email);

        // Update
        const updated = await transactionRepo.update(created.id, { name: TEST_NAMES.UPDATED });
        expect(updated).toBeDefined();
        expect(updated?.name).toBe(TEST_NAMES.UPDATED);
        expect(updated?.updatedAt).not.toBe(created.updatedAt);

        // Hard Delete
        const deleted = await transactionRepo.delete(created.id);
        expect(deleted).toBe(true);

        const foundAfterDelete = await transactionRepo.findById(created.id);
        expect(foundAfterDelete).toBeUndefined();
      });
    });
  });

  describe('User Status Management', () => {
    it('should manage active and inactive users correctly', async () => {
      await withUserTransactionTest(async (transactionRepo) => {
        const activeUser = await transactionRepo.create(testUser);
        const inactiveUser = await transactionRepo.create({
          ...testUser,
          email: TEST_EMAILS.INACTIVE,
          status: 'active' as const
        });
        await transactionRepo.softDelete(inactiveUser.id);

        const activeUsers = await transactionRepo.findActive();
        expect(activeUsers).toHaveLength(1);
        expect(activeUsers[0].id).toBe(activeUser.id);
      });
    });
  });

  describe('Database Constraints', () => {
    it('should enforce unique email constraint', async () => {
      await withUserTransactionTest(async (transactionRepo) => {
        await transactionRepo.create(testUser);

        // Use the error assertion utility
        await ErrorAssertions.assertUniqueViolation(() => transactionRepo.create(testUser));

        // Additional metadata checks if needed
        const error = await transactionRepo.create(testUser).catch((e) => e);
        expect(error.metadata?.operation).toBe('create');
        expect(error.metadata?.entityType).toBe('user');
      });
    });

    it('should validate user input', async () => {
      await withUserTransactionTest(async (transactionRepo) => {
        const invalidUser = {
          ...testUser,
          email: 'invalid-email'
        };

        // Use the error assertion utility
        await ErrorAssertions.assertValidationFailed(
          () => transactionRepo.create(invalidUser),
          'email'
        );

        // Additional metadata checks if needed
        const error = await transactionRepo.create(invalidUser).catch((e) => e);
        expect(error.metadata?.entityType).toBe('user');
      });
    });

    it('should validate name length', async () => {
      await withUserTransactionTest(async (transactionRepo) => {
        const emptyNameUser = { ...testUser, name: '' };
        const longNameUser = { ...testUser, name: 'a'.repeat(101) };

        // Use the error assertion utility for empty name
        await ErrorAssertions.assertValidationFailed(
          () => transactionRepo.create(emptyNameUser),
          'name'
        );

        // Use the error assertion utility for long name
        await ErrorAssertions.assertValidationFailed(
          () => transactionRepo.create(longNameUser),
          'name'
        );

        // Additional metadata checks if needed
        const error = await transactionRepo.create(emptyNameUser).catch((e) => e);
        expect(error.metadata?.entityType).toBe('user');
      });
    });
  });

  describe('Bulk Operations', () => {
    it('should find all users', async () => {
      await withUserTransactionTest(async (transactionRepo) => {
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
        await transactionRepo.createMany(users);

        // Find all users
        const allUsers = await transactionRepo.findAll();
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
    });

    it('should create multiple users', async () => {
      await withUserTransactionTest(async (transactionRepo) => {
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

        const created = await transactionRepo.createMany(users);
        expect(created).toHaveLength(3);
        expect(created[0].email).toBe(testUser.email);
        expect(created[1].email).toBe(TEST_EMAILS.SECONDARY);
        expect(created[2].email).toBe(TEST_EMAILS.THIRD);
      });
    });

    it('should handle empty array in createMany', async () => {
      await withUserTransactionTest(async (transactionRepo) => {
        const created = await transactionRepo.createMany([]);
        expect(created).toHaveLength(0);
      });
    });

    it('should update multiple users by status', async () => {
      await withUserTransactionTest(async (transactionRepo) => {
        await transactionRepo.create(testUser);
        await transactionRepo.create({
          ...testUser,
          email: TEST_EMAILS.SECONDARY,
          status: 'active' as const
        });

        const updateCount = await transactionRepo.updateMany(
          { status: 'active' },
          { name: TEST_NAMES.UPDATED }
        );

        expect(updateCount).toBe(2);

        const activeUsers = await transactionRepo.findActive();
        expect(activeUsers).toHaveLength(2);
        activeUsers.forEach((user) => {
          expect(user.name).toBe(TEST_NAMES.UPDATED);
        });
      });
    });

    it('should delete multiple users by status', async () => {
      await withUserTransactionTest(async (transactionRepo) => {
        await transactionRepo.create(testUser);
        await transactionRepo.create({
          ...testUser,
          email: TEST_EMAILS.SECONDARY,
          status: 'active' as const
        });

        const deleteCount = await transactionRepo.softDeleteMany({ status: 'active' });
        expect(deleteCount).toBe(2);

        const activeUsers = await transactionRepo.findActive();
        expect(activeUsers).toHaveLength(0);
      });
    });
  });

  describe('Count Operations', () => {
    it('should count all users', async () => {
      await withUserTransactionTest(async (transactionRepo) => {
        await transactionRepo.create(testUser);
        await transactionRepo.create({
          ...testUser,
          email: 'test2@example.com',
          status: 'active' as const
        });

        const totalCount = await transactionRepo.count();
        expect(totalCount).toBe(2);
      });
    });

    it('should count users by status', async () => {
      await withUserTransactionTest(async (transactionRepo) => {
        await transactionRepo.create(testUser);
        const inactiveUser = await transactionRepo.create({
          ...testUser,
          email: TEST_EMAILS.INACTIVE,
          status: 'active' as const
        });
        await transactionRepo.softDelete(inactiveUser.id);

        const activeCount = await transactionRepo.count({ status: 'active' });
        expect(activeCount).toBe(1);

        const inactiveCount = await transactionRepo.count({ status: 'inactive' });
        expect(inactiveCount).toBe(1);
      });
    });
  });

  describe('Transaction Operations', () => {
    it('should successfully execute multiple operations in a transaction', async () => {
      await withUserTransactionTest(async (transactionRepo) => {
        const result = await transactionRepo.withTransaction(async (tx) => {
          const user1 = await transactionRepo.create(
            {
              ...testUser,
              email: TEST_EMAILS.MAIN
            },
            tx
          );

          const user2 = await transactionRepo.create(
            {
              ...testUser,
              email: TEST_EMAILS.SECONDARY
            },
            tx
          );

          await transactionRepo.update(user1.id, { name: TEST_NAMES.UPDATED }, tx);

          return { user1Id: user1.id, user2Id: user2.id };
        });

        // Verify operations were successful
        const updatedUser1 = await transactionRepo.findById(result.user1Id);
        const user2 = await transactionRepo.findById(result.user2Id);

        expect(updatedUser1?.name).toBe(TEST_NAMES.UPDATED);
        expect(user2?.email).toBe(TEST_EMAILS.SECONDARY);
      });
    });

    it('should rollback transaction on error', async () => {
      await withUserTransactionTest(async (transactionRepo) => {
        const initialCount = await transactionRepo.count();

        // Attempt operations that will fail
        const error = await transactionRepo
          .withTransaction(async (tx) => {
            // First operation succeeds
            await transactionRepo.create(
              {
                ...testUser,
                email: TEST_EMAILS.MAIN
              },
              tx
            );

            // Second operation fails (duplicate email)
            await transactionRepo.create(
              {
                ...testUser,
                email: TEST_EMAILS.MAIN // Same email to trigger unique constraint
              },
              tx
            );
          })
          .catch((e) => e);

        // Verify transaction was rolled back
        const finalCount = await transactionRepo.count();
        expect(finalCount).toBe(initialCount);
        expect(error).toBeInstanceOf(DatabaseError);
        expect(error.code).toBe('UNIQUE_VIOLATION');
        expect(error.metadata?.operation).toBe('create');
        expect(error.metadata?.entityType).toBe('user');
      });
    });
  });
});
