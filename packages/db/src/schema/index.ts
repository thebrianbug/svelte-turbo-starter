import { pgTable, serial, text, timestamp, index, pgEnum } from 'drizzle-orm/pg-core';
import { type InferSelectModel, type InferInsertModel } from 'drizzle-orm';

// Define status as an enum for type safety
export const userStatusEnum = pgEnum('user_status', ['active', 'inactive']);

export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    status: userStatusEnum('status').notNull().default('active'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
  },
  (table) => {
    return {
      // Prefix index name with table name for clarity
      usersEmailIdx: index('users_email_idx').on(table.email)
    };
  }
);

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;
export type UserStatus = 'active' | 'inactive';
