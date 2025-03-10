import { describe, it, expect, beforeEach } from 'vitest';
import { mock, instance, when, verify, deepEqual } from 'ts-mockito';
import { UserService } from './user-service';
import type { IUserRepository, User } from '@repo/db';
import { validateNewUser, validateUpdateUser } from '@repo/db/src/domains/users/models/user';
import {
  DuplicateEntityError,
  EntityNotFoundError,
  OperationError,
  DatabaseError,
  ValidationError
} from '@repo/shared';

const TEST_DATA = {
  EMAIL: 'test@example.com',
  NAME: 'Test User',
  UPDATED_NAME: 'Updated Name',
  EXISTING_EMAIL: 'existing@example.com',
  USER_NOT_FOUND_MESSAGE: 'User not found: 1',
  EMAIL_EXISTS_MESSAGE: 'email already exists',
  CREATE_USER_PREFIX: 'Failed to createUser User:',
  GET_USER_PREFIX: 'Failed to getUserById User:',
  UPDATE_USER_PREFIX: 'Failed to updateUser User:',
  UPDATE_USER_FIND_PREFIX: 'Failed to updateUser.findById User:',
  DEACTIVATE_USER_PREFIX: 'Failed to deactivateUser User:',
  GET_ACTIVE_USERS_PREFIX: 'Failed to getActiveUsers User:'
} as const;

// Error codes
const ERROR_CODES = {
  NOT_FOUND: 'NOT_FOUND',
  DUPLICATE_KEY: 'DUPLICATE_KEY',
  VALIDATION: 'VALIDATION',
  CONNECTION_ERROR: 'CONNECTION_ERROR',
  OPERATION_FAILED: 'OPERATION_FAILED',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;

// Error messages
const ERROR_MESSAGES = {
  DATABASE_CONNECTION_FAILED: 'Database connection failed',
  INSERT_OPERATION_FAILED: 'Insert operation failed',
  UPDATE_OPERATION_FAILED: 'Update operation failed',
  SOFT_DELETE_OPERATION_FAILED: 'Soft delete operation failed',
  QUERY_OPERATION_FAILED: 'Query operation failed',
  VALIDATION_FAILED: 'Validation failed',
  DUPLICATE_KEY_VIOLATION: 'Duplicate key violation',
  USER_NOT_FOUND: 'User not found',
  UNKNOWN_DATABASE_ERROR: 'Unknown database error'
} as const;

// Database operations
const DB_OPERATIONS = {
  FIND_BY_EMAIL: 'findByEmail',
  FIND_BY_ID: 'findById',
  CREATE: 'create',
  UPDATE: 'update',
  SOFT_DELETE: 'softDelete',
  FIND_ACTIVE: 'findActive'
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
  let defaultUserData: { email: string; name: string };

  // Helper function to create a NOT_FOUND database error
  const createNotFoundError = (email: string): DatabaseError => {
    return new DatabaseError(ERROR_CODES.NOT_FOUND, ERROR_MESSAGES.USER_NOT_FOUND, { email });
  };

  beforeEach(() => {
    userRepositoryMock = mock<IUserRepository>();
    userRepository = instance(userRepositoryMock);
    userService = new UserService(userRepository);
    defaultUserData = {
      email: TEST_DATA.EMAIL,
      name: TEST_DATA.NAME
    };
  });

  describe('createUser', () => {
    it('should create a new user with validation', async () => {
      const userData = { ...defaultUserData };

      const validatedData = validateNewUser(userData);
      const expectedUser = createMockUser({
        email: userData.email,
        name: userData.name,
        status: validatedData.status
      });

      // Use a DatabaseError with NOT_FOUND code
      when(userRepositoryMock.findByEmail(userData.email)).thenReject(
        createNotFoundError(userData.email)
      );
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

      // Use a DatabaseError with NOT_FOUND code
      when(userRepositoryMock.findByEmail(userData.email)).thenReject(
        createNotFoundError(userData.email)
      );
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
          name: TEST_DATA.NAME
        })
      );

      await expect(userService.createUser(userData)).rejects.toThrow(DuplicateEntityError);
      await expect(userService.createUser(userData)).rejects.toThrow(
        TEST_DATA.EMAIL_EXISTS_MESSAGE
      );
    });

    it('should handle database errors during email check', async () => {
      const userData = { ...defaultUserData };

      // Simulate a database connection error
      const dbError = new DatabaseError(
        ERROR_CODES.CONNECTION_ERROR,
        ERROR_MESSAGES.DATABASE_CONNECTION_FAILED,
        {
          operation: DB_OPERATIONS.FIND_BY_EMAIL
        }
      );
      when(userRepositoryMock.findByEmail(userData.email)).thenReject(dbError);

      await expect(userService.createUser(userData)).rejects.toThrow(OperationError);
      await expect(userService.createUser(userData)).rejects.toThrow(TEST_DATA.CREATE_USER_PREFIX);
    });

    it('should handle database errors during user creation', async () => {
      const userData = { ...defaultUserData };

      // First findByEmail returns NOT_FOUND (expected)
      when(userRepositoryMock.findByEmail(userData.email)).thenReject(
        createNotFoundError(userData.email)
      );

      // Then create throws a database error
      const dbError = new DatabaseError(
        ERROR_CODES.OPERATION_FAILED,
        ERROR_MESSAGES.INSERT_OPERATION_FAILED,
        {
          operation: DB_OPERATIONS.CREATE
        }
      );
      when(userRepositoryMock.create(deepEqual(validateNewUser(userData)))).thenReject(dbError);

      await expect(userService.createUser(userData)).rejects.toThrow(OperationError);
      await expect(userService.createUser(userData)).rejects.toThrow(TEST_DATA.CREATE_USER_PREFIX);
    });

    it('should throw validation error for invalid data', async () => {
      const invalidData = {
        email: 'invalid-email',
        name: ''
      };

      await expect(userService.createUser(invalidData)).rejects.toThrow(ValidationError);
      await expect(userService.createUser(invalidData)).rejects.toThrow('User validation error');
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
      await expect(userService.getUserById(1)).rejects.toThrow(TEST_DATA.USER_NOT_FOUND_MESSAGE);
    });

    it('should map database errors during getUserById', async () => {
      const dbError = new DatabaseError(
        ERROR_CODES.CONNECTION_ERROR,
        ERROR_MESSAGES.DATABASE_CONNECTION_FAILED,
        {
          operation: DB_OPERATIONS.FIND_BY_ID
        }
      );
      when(userRepositoryMock.findById(1)).thenReject(dbError);

      await expect(userService.getUserById(1)).rejects.toThrow(OperationError);
      await expect(userService.getUserById(1)).rejects.toThrow(TEST_DATA.GET_USER_PREFIX);
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
      await expect(userService.updateUser(1, { name: TEST_DATA.UPDATED_NAME })).rejects.toThrow(
        TEST_DATA.USER_NOT_FOUND_MESSAGE
      );
    });

    it('should map database errors during findById in updateUser', async () => {
      const dbError = new DatabaseError(
        ERROR_CODES.CONNECTION_ERROR,
        ERROR_MESSAGES.DATABASE_CONNECTION_FAILED,
        {
          operation: DB_OPERATIONS.FIND_BY_ID
        }
      );
      when(userRepositoryMock.findById(1)).thenReject(dbError);

      await expect(userService.updateUser(1, { name: TEST_DATA.UPDATED_NAME })).rejects.toThrow(
        OperationError
      );
      await expect(userService.updateUser(1, { name: TEST_DATA.UPDATED_NAME })).rejects.toThrow(
        /updateUser\.findById/
      );
    });

    it('should map database errors during update operation', async () => {
      const userId = 1;
      const updateData = { name: TEST_DATA.UPDATED_NAME };
      const validatedData = validateUpdateUser(updateData);

      // First findById succeeds
      when(userRepositoryMock.findById(userId)).thenResolve(createMockUser());

      // But update fails with a database error
      const dbError = new DatabaseError(
        ERROR_CODES.OPERATION_FAILED,
        ERROR_MESSAGES.UPDATE_OPERATION_FAILED,
        {
          operation: DB_OPERATIONS.UPDATE
        }
      );
      when(userRepositoryMock.update(userId, deepEqual(validatedData))).thenReject(dbError);

      await expect(userService.updateUser(userId, updateData)).rejects.toThrow(OperationError);
      await expect(userService.updateUser(userId, updateData)).rejects.toThrow(/updateUser/);
    });

    it('should throw validation error for invalid update data', async () => {
      const userId = 1;
      const invalidData = {
        email: 'invalid-email'
      };

      when(userRepositoryMock.findById(userId)).thenResolve(createMockUser());

      await expect(userService.updateUser(userId, invalidData)).rejects.toThrow(ValidationError);
      await expect(userService.updateUser(userId, invalidData)).rejects.toThrow(
        /User validation error/
      );
    });
  });

  describe('deactivateUser', () => {
    it('should deactivate user successfully', async () => {
      when(userRepositoryMock.softDelete(1)).thenResolve(true);

      await userService.deactivateUser(1);
      verify(userRepositoryMock.softDelete(1)).once();
    });

    it('should throw error if deactivation fails', async () => {
      when(userRepositoryMock.softDelete(1)).thenResolve(false);

      await expect(userService.deactivateUser(1)).rejects.toThrow(OperationError);
      await expect(userService.deactivateUser(1)).rejects.toThrow(/deactivateUser/);
    });

    it('should map database errors during deactivation', async () => {
      const dbError = new DatabaseError(
        ERROR_CODES.OPERATION_FAILED,
        ERROR_MESSAGES.SOFT_DELETE_OPERATION_FAILED,
        {
          operation: DB_OPERATIONS.SOFT_DELETE
        }
      );
      when(userRepositoryMock.softDelete(1)).thenReject(dbError);

      await expect(userService.deactivateUser(1)).rejects.toThrow(OperationError);
      await expect(userService.deactivateUser(1)).rejects.toThrow(/deactivateUser/);
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

    it('should map database errors when getting active users', async () => {
      const dbError = new DatabaseError(
        ERROR_CODES.OPERATION_FAILED,
        ERROR_MESSAGES.QUERY_OPERATION_FAILED,
        {
          operation: DB_OPERATIONS.FIND_ACTIVE
        }
      );
      when(userRepositoryMock.findActive()).thenReject(dbError);

      await expect(userService.getActiveUsers()).rejects.toThrow(OperationError);
      await expect(userService.getActiveUsers()).rejects.toThrow(/getActiveUsers/);
    });

    it('should return empty array when no active users exist', async () => {
      when(userRepositoryMock.findActive()).thenResolve([]);

      const result = await userService.getActiveUsers();

      verify(userRepositoryMock.findActive()).once();
      expect(result).toEqual([]);
    });
  });

  describe('Error mapping', () => {
    it('should map NOT_FOUND database errors to EntityNotFoundError', async () => {
      const dbError = new DatabaseError(ERROR_CODES.NOT_FOUND, ERROR_MESSAGES.USER_NOT_FOUND, {
        id: 999
      });
      when(userRepositoryMock.findById(999)).thenReject(dbError);

      await expect(userService.getUserById(999)).rejects.toThrow(EntityNotFoundError);
      await expect(userService.getUserById(999)).rejects.toThrow(/User not found: 999/);
    });

    it('should map DUPLICATE_KEY database errors to DuplicateEntityError', async () => {
      // Create a mock user first to avoid the initial NOT_FOUND check
      const userData = { ...defaultUserData };

      // Make findByEmail throw a database error with DUPLICATE_KEY code
      const dbError = new DatabaseError(
        ERROR_CODES.DUPLICATE_KEY,
        ERROR_MESSAGES.DUPLICATE_KEY_VIOLATION,
        {
          field: 'email',
          value: TEST_DATA.EMAIL
        }
      );
      when(userRepositoryMock.findByEmail(userData.email)).thenReject(dbError);

      await expect(userService.createUser(userData)).rejects.toThrow(DuplicateEntityError);
      await expect(userService.createUser(userData)).rejects.toThrow(
        TEST_DATA.EMAIL_EXISTS_MESSAGE
      );
    });

    it('should map VALIDATION database errors to ValidationError', async () => {
      const userData = { ...defaultUserData };

      // Make findByEmail throw a database error with VALIDATION code
      const dbError = new DatabaseError(ERROR_CODES.VALIDATION, ERROR_MESSAGES.VALIDATION_FAILED, {
        field: 'email'
      });
      when(userRepositoryMock.findByEmail(userData.email)).thenReject(dbError);

      await expect(userService.createUser(userData)).rejects.toThrow(ValidationError);
    });

    it('should map unknown database errors to OperationError', async () => {
      const userData = { ...defaultUserData };

      // Make findByEmail throw a database error with an unknown code
      const dbError = new DatabaseError(
        ERROR_CODES.UNKNOWN_ERROR,
        ERROR_MESSAGES.UNKNOWN_DATABASE_ERROR,
        {}
      );
      when(userRepositoryMock.findByEmail(userData.email)).thenReject(dbError);

      await expect(userService.createUser(userData)).rejects.toThrow(OperationError);
      await expect(userService.createUser(userData)).rejects.toThrow(TEST_DATA.CREATE_USER_PREFIX);
    });

    it('should handle non-database errors properly', async () => {
      const randomError = new Error('Random system error');
      when(userRepositoryMock.findById(1)).thenReject(randomError);

      await expect(userService.getUserById(1)).rejects.toThrow(OperationError);
      await expect(userService.getUserById(1)).rejects.toThrow(/Random system error/);
    });
  });
});
