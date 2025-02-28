import { pgTable, serial, text, timestamp, index } from 'drizzle-orm/pg-core';
import { type InferSelectModel, type InferInsertModel } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => {
  return {
    emailIdx: index('email_idx').on(table.email)
  }
});

// Export types for bll package using new type inference
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;
