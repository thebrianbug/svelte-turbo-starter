import { describe, it, expect, beforeEach } from 'vitest';
import { mock, instance, when, verify, deepEqual } from 'ts-mockito';
import { UserService } from './user-service';
import type { IUserRepository, User } from '@repo/db';
import { validateNewUser, validateUpdateUser } from '@repo/db/src/domains/users/models/user';
import { DuplicateEntityError, EntityNotFoundError, OperationError } from '@repo/shared';

const TEST_DATA = {
  EMAIL: 'test@example.com',
  NAME: 'Test User',
  UPDATED_NAME: 'Updated Name',
  EXISTING_EMAIL: 'existing@example.com'
} as const;

describe('UserService', () => {
  const createMockUser = (override: Partial<User> = {}): User => ({
    id: 1,
    email: TEST_DATA.EMAIL,
    name: TEST_DATA.NAME,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...override
  });

  let userRepository: IUserRepository;
  let userRepositoryMock: IUserRepository;
  let userService: UserService;

  beforeEach(() => {
    userRepositoryMock = mock<IUserRepository>();
    userRepository = instance(userRepositoryMock);
    userService = new UserService(userRepository);
  });

  describe('createUser', () => {
    it('should create a new user with validation', async () => {
      const userData = {
        email: TEST_DATA.EMAIL,
        name: TEST_DATA.NAME
      };

      const validatedData = validateNewUser(userData);
      const expectedUser = createMockUser({
        email: userData.email,
        name: userData.name,
        status: validatedData.status
      });

      when(userRepositoryMock.findByEmail(userData.email)).thenReject(new Error('NOT_FOUND'));
      when(userRepositoryMock.create(deepEqual(validatedData))).thenResolve(expectedUser);

      const result = await userService.createUser(userData);

      verify(userRepositoryMock.create(deepEqual(validatedData))).once();
      expect(result).toEqual(expectedUser);
    });

    it('should create a new user with custom status after validation', async () => {
      const userData = {
        email: TEST_DATA.EMAIL,
        name: TEST_DATA.NAME,
        status: 'inactive' as const
      };

      const validatedData = validateNewUser(userData);
      const expectedUser = createMockUser({
        ...validatedData
      });

      when(userRepositoryMock.findByEmail(userData.email)).thenReject(new Error('NOT_FOUND'));
      when(userRepositoryMock.create(deepEqual(validatedData))).thenResolve(expectedUser);

      const result = await userService.createUser(userData);

      verify(userRepositoryMock.create(deepEqual(validatedData))).once();
      expect(result).toEqual(expectedUser);
    });

    it('should throw error if user with email already exists', async () => {
      const userData = {
        email: TEST_DATA.EXISTING_EMAIL,
        name: TEST_DATA.NAME
      };

      when(userRepositoryMock.findByEmail(userData.email)).thenResolve(
        createMockUser({
          email: userData.email,
          name: 'Existing User'
        })
      );

      await expect(userService.createUser(userData)).rejects.toThrow(DuplicateEntityError);
    });

    it('should throw validation error for invalid data', async () => {
      const invalidData = {
        email: 'invalid-email',
        name: ''
      };

      await expect(userService.createUser(invalidData)).rejects.toThrow();
    });
  });

  describe('getUserById', () => {
    it('should return user by id', async () => {
      const expectedUser = createMockUser();

      when(userRepositoryMock.findById(1)).thenResolve(expectedUser);

      const result = await userService.getUserById(1);

      verify(userRepositoryMock.findById(1)).once();
      expect(result).toEqual(expectedUser);
    });

    it('should throw error if user not found', async () => {
      when(userRepositoryMock.findById(1)).thenResolve(undefined);

      await expect(userService.getUserById(1)).rejects.toThrow(EntityNotFoundError);
    });
  });

  describe('updateUser', () => {
    it('should update user details with validation', async () => {
      const userId = 1;
      const updateData = {
        name: TEST_DATA.UPDATED_NAME
      };

      const validatedData = validateUpdateUser(updateData);
      const existingUser = createMockUser({
        id: userId,
        name: 'Original Name'
      });

      const updatedUser = createMockUser({
        ...existingUser,
        ...validatedData
      });

      when(userRepositoryMock.findById(userId)).thenResolve(existingUser);
      when(userRepositoryMock.update(userId, deepEqual(validatedData))).thenResolve(updatedUser);

      const result = await userService.updateUser(userId, updateData);

      verify(userRepositoryMock.update(userId, deepEqual(validatedData))).once();
      expect(result).toEqual(updatedUser);
    });

    it('should throw error if user not found', async () => {
      when(userRepositoryMock.findById(1)).thenResolve(undefined);

      await expect(userService.updateUser(1, { name: TEST_DATA.UPDATED_NAME })).rejects.toThrow(
        EntityNotFoundError
      );
    });

    it('should throw validation error for invalid update data', async () => {
      const userId = 1;
      const invalidData = {
        email: 'invalid-email'
      };

      when(userRepositoryMock.findById(userId)).thenResolve(createMockUser());

      await expect(userService.updateUser(userId, invalidData)).rejects.toThrow();
    });
  });

  describe('deactivateUser', () => {
    it('should deactivate user successfully', async () => {
      when(userRepositoryMock.softDelete(1)).thenResolve(true);

      await expect(userService.deactivateUser(1)).resolves.not.toThrow();
      verify(userRepositoryMock.softDelete(1)).once();
    });

    it('should throw error if deactivation fails', async () => {
      when(userRepositoryMock.softDelete(1)).thenResolve(false);

      await expect(userService.deactivateUser(1)).rejects.toThrow(OperationError);
    });
  });

  describe('getActiveUsers', () => {
    it('should return all active users', async () => {
      const expectedUsers = [
        createMockUser({ id: 1, email: 'user1@example.com' }),
        createMockUser({ id: 2, email: 'user2@example.com' })
      ];

      when(userRepositoryMock.findActive()).thenResolve(expectedUsers);

      const result = await userService.getActiveUsers();

      verify(userRepositoryMock.findActive()).once();
      expect(result).toEqual(expectedUsers);
    });

    it('should return empty array when no active users exist', async () => {
      when(userRepositoryMock.findActive()).thenResolve([]);

      const result = await userService.getActiveUsers();

      verify(userRepositoryMock.findActive()).once();
      expect(result).toEqual([]);
    });
  });
});
