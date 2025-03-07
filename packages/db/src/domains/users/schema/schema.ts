import { pgTable, serial, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import type { User } from '../models/user';

export const userStatusEnum = pgEnum('user_status', ['active', 'inactive']);

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  status: userStatusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}) satisfies {
  $inferSelect: User;
};

export default users;
