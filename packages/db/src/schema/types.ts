import { type InferSelectModel, type InferInsertModel } from 'drizzle-orm';
import { users } from './tables/users';

// Export shared types for database models
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

// Export shared enums as types
export type UserStatus = 'active' | 'inactive';
