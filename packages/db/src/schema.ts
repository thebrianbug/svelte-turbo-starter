// File: /home/brianbug/source/svelte-turbo-starter/packages/db/src/schema.ts
import { users } from './domains/users/schema/schema';
// Import other domain schemas here if they existed
// import { products } from './domains/products/schema/schema';

/**
 * Combined database schema for Drizzle ORM.
 * Includes all tables from different domains.
 */
export const schema = {
  users
  // products, // Add other imported schemas here
};

export type DBSchema = typeof schema;
