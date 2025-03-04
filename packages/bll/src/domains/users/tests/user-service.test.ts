import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserService } from '../user-service';
import type { IUserRepository, User } from '@repo/db';
import { validateNewUser, validateUpdateUser } from '@repo/db/src/domains/users/models/user';

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
  let userService: UserService;

  beforeEach(() => {
    userRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findByEmail: vi.fn(),
      findActive: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      softDelete: vi.fn(),
      softDeleteMany: vi.fn(),
      count: vi.fn()
    };
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

      vi.mocked(userRepository.findByEmail).mockRejectedValue(new Error('NOT_FOUND'));
      vi.mocked(userRepository.create).mockResolvedValue(expectedUser);

      const result = await userService.createUser(userData);

      expect(userRepository.create).toHaveBeenCalledWith(validatedData);
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

      vi.mocked(userRepository.findByEmail).mockRejectedValue(new Error('NOT_FOUND'));
      vi.mocked(userRepository.create).mockResolvedValue(expectedUser);

      const result = await userService.createUser(userData);

      expect(userRepository.create).toHaveBeenCalledWith(validatedData);
      expect(result).toEqual(expectedUser);
    });

    it('should throw error if user with email already exists', async () => {
      const userData = {
        email: TEST_DATA.EXISTING_EMAIL,
        name: TEST_DATA.NAME
      };

      vi.mocked(userRepository.findByEmail).mockResolvedValue(
        createMockUser({
          email: userData.email,
          name: 'Existing User'
        })
      );

      await expect(userService.createUser(userData)).rejects.toThrow(
        'User with this email already exists'
      );
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

      vi.mocked(userRepository.findById).mockResolvedValue(expectedUser);

      const result = await userService.getUserById(1);

      expect(userRepository.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(expectedUser);
    });

    it('should throw error if user not found', async () => {
      vi.mocked(userRepository.findById).mockResolvedValue(undefined);

      await expect(userService.getUserById(1)).rejects.toThrow('User not found');
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

      vi.mocked(userRepository.findById).mockResolvedValue(existingUser);
      vi.mocked(userRepository.update).mockResolvedValue(updatedUser);

      const result = await userService.updateUser(userId, updateData);

      expect(userRepository.update).toHaveBeenCalledWith(userId, validatedData);
      expect(result).toEqual(updatedUser);
    });

    it('should throw error if user not found', async () => {
      vi.mocked(userRepository.findById).mockResolvedValue(undefined);

      await expect(userService.updateUser(1, { name: TEST_DATA.UPDATED_NAME })).rejects.toThrow(
        'User not found'
      );
    });

    it('should throw validation error for invalid update data', async () => {
      const userId = 1;
      const invalidData = {
        email: 'invalid-email'
      };

      vi.mocked(userRepository.findById).mockResolvedValue(createMockUser());

      await expect(userService.updateUser(userId, invalidData)).rejects.toThrow();
    });
  });

  describe('deactivateUser', () => {
    it('should deactivate user successfully', async () => {
      vi.mocked(userRepository.softDelete).mockResolvedValue(true);

      await expect(userService.deactivateUser(1)).resolves.not.toThrow();
      expect(userRepository.softDelete).toHaveBeenCalledWith(1);
    });

    it('should throw error if deactivation fails', async () => {
      vi.mocked(userRepository.softDelete).mockResolvedValue(false);

      await expect(userService.deactivateUser(1)).rejects.toThrow('Failed to deactivate user');
    });
  });
});
