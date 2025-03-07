import type { IUserRepository, User } from '@repo/db';
import { validateNewUser, validateUpdateUser } from '@repo/db/src/domains/users/models/user';
import { EntityNotFoundError, DuplicateEntityError, OperationError } from '@repo/shared';

export class UserService {
  constructor(private readonly userRepository: IUserRepository) {}

  async createUser(userData: unknown): Promise<User> {
    const validatedData = validateNewUser(userData);

    try {
      await this.userRepository.findByEmail(validatedData.email);
      throw new DuplicateEntityError('User', 'email', validatedData.email);
    } catch (error) {
      if (error instanceof Error && error.message.includes('NOT_FOUND')) {
        return this.userRepository.create(validatedData);
      }
      throw error;
    }
  }

  async getUserById(id: number): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new EntityNotFoundError('User', id);
    }
    return user;
  }

  async updateUser(id: number, updateData: unknown): Promise<User> {
    const validatedData = validateUpdateUser(updateData);

    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new EntityNotFoundError('User', id);
    }
    return this.userRepository.update(id, validatedData);
  }

  async deactivateUser(id: number): Promise<void> {
    const success = await this.userRepository.softDelete(id);
    if (!success) {
      throw new OperationError('User', 'deactivateUser', id.toString());
    }
  }

  async getActiveUsers(): Promise<User[]> {
    return this.userRepository.findActive();
  }
}
