# @repo/db

Database package using Drizzle ORM with PostgreSQL.

## Setup

1. Start the database:

```bash
npm run db:up
```

2. Generate migrations:

```bash
npm run db:generate
```

3. Push migrations to database:

```bash
npm run db:push
```

## Usage

```typescript
import { db, users } from '@repo/db';

// Example: Create a new user
const newUser = await db
  .insert(users)
  .values({
    name: 'John Doe',
    email: 'john@example.com'
  })
  .returning();

// Example: Query users
const allUsers = await db.select().from(users);
```

## Environment Variables

The following environment variables can be used to configure the database connection:

- `DATABASE_URL`: Full connection string (optional, defaults to local development configuration)
- `DATABASE_HOST`: Database host (default: "localhost")
- `DATABASE_PORT`: Database port (default: 5432)
- `DATABASE_USER`: Database user (default: "postgres")
- `DATABASE_PASSWORD`: Database password (default: "postgres")
- `DATABASE_NAME`: Database name (default: "svelte_turbo_db")
