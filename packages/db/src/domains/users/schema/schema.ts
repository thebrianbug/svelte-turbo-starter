import { pgTable, serial, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';

// User status type
export type UserStatus = 'active' | 'inactive';

// User status enum
export const userStatusEnum = pgEnum('user_status', ['active', 'inactive']);

// Users table schema
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  status: userStatusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Base user type from database schema
export type User = typeof users.$inferSelect;

// Type for creating new users
export type NewUser = Omit<typeof users.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>;

// Re-export the table for use in other modules
export default users;
