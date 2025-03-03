import type { User, NewUser, UserStatus } from '../models/user';

export type IUserRepository = {
  findById(id: number): Promise<User | undefined>;
  findByEmail(email: string): Promise<User | undefined>;
  findActive(): Promise<User[]>;
  create(newUser: NewUser): Promise<User>;
  createMany(newUsers: NewUser[]): Promise<User[]>;
  update(id: number, userData: Partial<NewUser>): Promise<User>;
  updateMany(filter: { status: UserStatus }, update: Partial<NewUser>): Promise<number>;
  softDelete(id: number): Promise<boolean>;
  softDeleteMany(filter: { status: 'active' }): Promise<number>;
  count(filter?: { status?: UserStatus }): Promise<number>;
};
