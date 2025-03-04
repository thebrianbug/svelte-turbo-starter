import type { User, UserStatus } from '../models/user';
import type { ValidatedNewUser, ValidatedUpdateUser } from '../models/user';

export interface IUserRepository {
  findById(id: number): Promise<User | undefined>;
  findByEmail(email: string): Promise<User | undefined>;
  findActive(): Promise<User[]>;
  create(newUser: ValidatedNewUser): Promise<User>;
  createMany(newUsers: ValidatedNewUser[]): Promise<User[]>;
  update(id: number, userData: ValidatedUpdateUser): Promise<User>;
  updateMany(filter: { status: UserStatus }, update: ValidatedUpdateUser): Promise<number>;
  softDelete(id: number): Promise<boolean>;
  softDeleteMany(filter: { status: 'active' }): Promise<number>;
  count(filter?: { status?: UserStatus }): Promise<number>;
}
