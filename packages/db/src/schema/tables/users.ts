import { pgTable, serial, text, timestamp, index } from 'drizzle-orm/pg-core';
import { userStatusEnum } from '../enums';

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
      usersEmailIdx: index('users_email_idx').on(table.email)
    };
  }
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
