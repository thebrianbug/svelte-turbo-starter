import type { IUserRepository } from '@svelte-turbo/db/src/domains/users/interfaces/IUserRepository';
import type { User } from '@svelte-turbo/db/src/domains/users/models/User';

type CreateUserData = {
  email: string;
  name: string;
  status?: 'active' | 'inactive';
};

type UpdateUserData = {
  name?: string;
  email?: string;
  status?: 'active' | 'inactive';
};

export class UserService {
  constructor(private readonly userRepository: IUserRepository) {}

  async createUser(userData: CreateUserData): Promise<User> {
    try {
      await this.userRepository.findByEmail(userData.email);
      throw new Error('User with this email already exists');
    } catch (error) {
      if (error instanceof Error && error.message.includes('NOT_FOUND')) {
        return this.userRepository.create({
          ...userData,
          status: userData.status ?? 'active'
        });
      }
      throw error;
    }
  }

  async getUserById(id: number): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async updateUser(id: number, updateData: UpdateUserData): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return this.userRepository.update(id, updateData);
  }

  async deactivateUser(id: number): Promise<void> {
    const success = await this.userRepository.softDelete(id);
    if (!success) {
      throw new Error('Failed to deactivate user');
    }
  }
}
