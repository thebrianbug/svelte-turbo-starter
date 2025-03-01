import type { IUserRepository } from '@svelte-turbo/db/src/domains/users/interfaces/IUserRepository';
import type { User } from '@svelte-turbo/db/src/domains/users/models/User';

interface CreateUserData {
  email: string;
  name: string;
  status?: 'active' | 'inactive';
}

interface UpdateUserData {
  name?: string;
  email?: string;
  status?: 'active' | 'inactive';
}

export class UserService {
  constructor(private readonly userRepository: IUserRepository) {}

  async createUser(userData: CreateUserData): Promise<User> {
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    return this.userRepository.create({
      ...userData,
      status: userData.status || 'active'
    });
  }

  async getUserById(id: number): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  async updateUser(id: number, updateData: UpdateUserData): Promise<User> {
    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new Error('User not found');
    }

    const updatedUser = await this.userRepository.update(id, updateData);
    if (!updatedUser) {
      throw new Error('Failed to update user');
    }

    return updatedUser;
  }

  async deactivateUser(id: number): Promise<void> {
    const success = await this.userRepository.softDelete(id);
    if (!success) {
      throw new Error('Failed to deactivate user');
    }
  }
}
