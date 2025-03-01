import type { User, NewUser, UserStatus } from '../models/User';

export interface IUserRepository {
  findById(id: number): Promise<User | undefined>;
  findByEmail(email: string): Promise<User | undefined>;
  findActive(): Promise<User[]>;
  create(newUser: NewUser): Promise<User>;
  createMany(newUsers: NewUser[]): Promise<User[]>;
  update(id: number, userData: Partial<NewUser>): Promise<User | undefined>;
  updateMany(filter: { status: UserStatus }, update: Partial<NewUser>): Promise<number>;
  softDelete(id: number): Promise<boolean>;
  softDeleteMany(filter: { status: 'active' }): Promise<number>;
  count(filter?: { status?: UserStatus }): Promise<number>;
}
