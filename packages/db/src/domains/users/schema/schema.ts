import { pgTable, serial, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import type { UserStatus } from '../models/User';

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

// Export types derived from the schema
export type DbUser = typeof users.$inferSelect;
export type DbNewUser = typeof users.$inferInsert;

// Re-export the table for use in other modules
export default users;
