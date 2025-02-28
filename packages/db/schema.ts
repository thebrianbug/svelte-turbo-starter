import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

// Example table - can be modified based on needs
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
