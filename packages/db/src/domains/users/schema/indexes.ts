import { index } from 'drizzle-orm/pg-core';

import { users } from './schema';

export const userIndexes = {
  usersEmailIdx: index('users_email_idx').on(users.email)
};
