import type { IUserRepository, User } from '@repo/db';
import { validateNewUser, validateUpdateUser } from '@repo/db/src/domains/users/models/user';
import {
  EntityNotFoundError,
  DuplicateEntityError,
  OperationError,
  DatabaseError,
  ValidationError
} from '@repo/shared';

export class UserService {
  constructor(private readonly userRepository: IUserRepository) {}

  async createUser(userData: unknown): Promise<User> {
    try {
      const validatedData = validateNewUser(userData);

      try {
        const existingUser = await this.userRepository.findByEmail(validatedData.email);
        if (existingUser) {
          throw new DuplicateEntityError('User', 'email', validatedData.email);
        }
      } catch (error) {
        // If error is NOT_FOUND, we're good to proceed
        if (error instanceof DatabaseError && error.code === 'NOT_FOUND') {
          // This is expected - no user with this email exists
        } else {
          // Unexpected error during email check
          throw this.mapDatabaseError(error, 'createUser');
        }
      }

      try {
        return await this.userRepository.create(validatedData);
      } catch (error) {
        throw this.mapDatabaseError(error, 'createUser');
      }
    } catch (error) {
      if (
        error instanceof ValidationError ||
        error instanceof DuplicateEntityError ||
        error instanceof EntityNotFoundError ||
        error instanceof OperationError
      ) {
        throw error; // Already a domain error, just propagate
      }
      // Handle unexpected validation errors
      throw new ValidationError(
        'User',
        error instanceof Error ? error.message : 'Invalid user data'
      );
    }
  }

  async getUserById(id: number): Promise<User> {
    try {
      const user = await this.userRepository.findById(id);
      if (!user) {
        throw new EntityNotFoundError('User', id);
      }
      return user;
    } catch (error) {
      throw this.mapDatabaseError(error, 'getUserById', id);
    }
  }

  async updateUser(id: number, updateData: unknown): Promise<User> {
    try {
      const validatedData = validateUpdateUser(updateData);

      try {
        const user = await this.userRepository.findById(id);
        if (!user) {
          throw new EntityNotFoundError('User', id);
        }
      } catch (error) {
        throw this.mapDatabaseError(error, 'updateUser.findById', id);
      }

      try {
        return await this.userRepository.update(id, validatedData);
      } catch (error) {
        throw this.mapDatabaseError(error, 'updateUser', id);
      }
    } catch (error) {
      if (
        error instanceof ValidationError ||
        error instanceof DuplicateEntityError ||
        error instanceof EntityNotFoundError ||
        error instanceof OperationError
      ) {
        throw error; // Already a domain error, just propagate
      }
      // Handle unexpected validation errors
      throw new ValidationError(
        'User',
        error instanceof Error ? error.message : 'Invalid update data'
      );
    }
  }

  async deactivateUser(id: number): Promise<void> {
    try {
      const success = await this.userRepository.softDelete(id);
      if (!success) {
        throw this.mapDatabaseError(
          new OperationError('User', 'deactivateUser', id.toString()),
          'deactivateUser',
          id
        );
      }
    } catch (error) {
      throw this.mapDatabaseError(error, 'deactivateUser', id);
    }
  }

  async getActiveUsers(): Promise<User[]> {
    try {
      return await this.userRepository.findActive();
    } catch (error) {
      throw this.mapDatabaseError(error, 'getActiveUsers');
    }
  }

  /**
   * Maps database errors to appropriate domain errors
   * @param error The original error
   * @param operation Name of the operation that failed
   * @param entityId Optional entity ID for reference
   * @returns Never returns - always throws an appropriate domain error
   */
  private mapDatabaseError(error: unknown, operation: string, entityId?: number | string): never {
    if (
      error instanceof EntityNotFoundError ||
      error instanceof DuplicateEntityError ||
      error instanceof OperationError
    ) {
      throw error; // Already a domain error, just propagate
    }

    if (error instanceof DatabaseError) {
      switch (error.code) {
        case 'NOT_FOUND':
          throw new EntityNotFoundError(
            'User',
            entityId !== undefined ? entityId : (error.metadata?.id as string | number) || 'unknown'
          );
        case 'DUPLICATE_KEY': {
          const field = (error.metadata?.field as string) || 'unknown';
          const value = (error.metadata?.value as string) || 'unknown';
          throw new DuplicateEntityError('User', field, value);
        }
        case 'VALIDATION':
          throw new ValidationError('User', error.message);
        default:
          throw new OperationError(
            'User',
            operation,
            `${entityId !== undefined ? String(entityId) : (error.metadata?.id as string) || 'unknown'}: ${error.message}`
          );
      }
    }

    // For any other errors
    throw new OperationError(
      'User',
      operation,
      `${entityId !== undefined ? String(entityId) : 'unknown'}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
