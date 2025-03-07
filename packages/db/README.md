# @repo/db

Database package using Drizzle ORM with PostgreSQL, following Domain-Driven Design principles.

## Domain-Driven Design

This package implements DDD principles to maintain a clean separation of concerns and reflect business domains:

1. Models represent core business concepts and encapsulate both data and behavior
2. Bounded contexts are maintained through package separation
3. We use ubiquitous language across the codebase
4. Value objects are implemented as immutable TypeScript types
5. Aggregates maintain data consistency through clear root entities

## Setup

1. Start the database (from the root directory):

```bash
npm run docker:up
```

2. Generate migrations:

```bash
npm run db:generate
```

3. Push migrations to database:

```bash
npm run db:push
```

4. Update migration snapshots (if needed):

```bash
npm run db:up
```

5. Launch Drizzle Studio (optional):

```bash
npm run db:studio
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
