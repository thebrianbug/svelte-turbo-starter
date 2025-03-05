import { pgTable, serial, text, timestamp, index, pgEnum } from 'drizzle-orm/pg-core';

// User status enum
export const userStatusEnum = pgEnum('user_status', ['active', 'inactive']);
export type UserStatus = 'active' | 'inactive';

// Users table schema
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
  (table) => [index('users_email_idx').on(table.email)]
);

// Export types derived from the schema
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
