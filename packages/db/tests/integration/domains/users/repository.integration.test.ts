import { describe, it, expect, beforeEach, afterAll } from 'vitest';

import { userRepository } from '../../../..';
import { DatabaseError } from '../../../../src/infrastructure/base-repository';
import { teardown, cleanTable, TABLES } from '../../test-utils/database';

import type { NewUser } from '../../../../src/domains/users/models/user';

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
  beforeEach(async () => {
    await cleanTable(TABLES.USERS);
  });

  afterAll(async () => {
    await teardown();
  });

  const testUser: NewUser = {
    name: 'Test User',
    email: TEST_EMAILS.MAIN,
    status: 'active'
  };

  describe('User Lifecycle', () => {
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

      const foundByEmail = await userRepository.findByEmail(testUser.email);
      expect(foundByEmail).toBeDefined();
      expect(foundByEmail?.email).toBe(testUser.email);

      // Update
      const updatedName = 'Updated Name';
      const updated = await userRepository.update(created.id, { name: TEST_NAMES.UPDATED });
      expect(updated).toBeDefined();
      expect(updated?.name).toBe(updatedName);
      expect(updated?.updatedAt).not.toBe(created.updatedAt);

      // Soft Delete
      const deleted = await userRepository.softDelete(created.id);
      expect(deleted).toBe(true);

      const foundAfterDelete = await userRepository.findById(created.id);
      expect(foundAfterDelete?.status).toBe('inactive');
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
      const error = await userRepository.create(testUser).catch((e) => e);
      expect(error).toBeInstanceOf(DatabaseError);
      expect(error.message).toContain('Unique constraint violation');
    });

    it('should validate user input', async () => {
      const invalidUser = {
        ...testUser,
        email: 'invalid-email'
      };
      await expect(userRepository.create(invalidUser)).rejects.toThrow(DatabaseError);
    });

    it('should validate name length', async () => {
      const emptyNameUser = { ...testUser, name: '' };
      const longNameUser = { ...testUser, name: 'a'.repeat(101) };

      await expect(userRepository.create(emptyNameUser)).rejects.toThrow(DatabaseError);
      await expect(userRepository.create(longNameUser)).rejects.toThrow(DatabaseError);
    });
  });

  describe('Bulk Operations', () => {
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
});
