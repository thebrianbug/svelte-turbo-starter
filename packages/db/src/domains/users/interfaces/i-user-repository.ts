import type { User, UserStatus } from '../models/user';
import type { ValidatedNewUser, ValidatedUpdateUser } from '../models/user';
import type { TransactionType } from '../../../infrastructure/base-repository';

export interface IUserRepository {
  // Query methods
  findById(id: number, tx?: TransactionType): Promise<User | undefined>;
  findByEmail(email: string, tx?: TransactionType): Promise<User | undefined>;
  findActive(tx?: TransactionType): Promise<User[]>;
  findAll(tx?: TransactionType): Promise<User[]>;

  // Mutation methods
  create(newUser: ValidatedNewUser, tx?: TransactionType): Promise<User>;
  createMany(newUsers: ValidatedNewUser[], tx?: TransactionType): Promise<User[]>;
  update(id: number, userData: ValidatedUpdateUser, tx?: TransactionType): Promise<User>;
  updateMany(
    filter: { status: UserStatus },
    update: ValidatedUpdateUser,
    tx?: TransactionType
  ): Promise<number>;
  delete(id: number, tx?: TransactionType): Promise<boolean>;
  softDelete(id: number, tx?: TransactionType): Promise<boolean>;
  softDeleteMany(filter: { status: 'active' }, tx?: TransactionType): Promise<number>;

  // Aggregate methods
  count(filter?: { status?: UserStatus }, tx?: TransactionType): Promise<number>;

  // Transaction support
  withTransaction<T>(fn: (tx: TransactionType) => Promise<T>): Promise<T>;
}
