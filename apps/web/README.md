# create-svelte

Everything you need to build a Svelte project, powered by [`create-svelte`](https://github.com/sveltejs/kit/tree/master/packages/create-svelte).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```bash
# create a new project in the current directory
npm create svelte@latest

# create a new project in my-app
npm create svelte@latest my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your target environment.

## E2E Testing with Database Access

This project plans to use a hybrid approach for managing database state in end-to-end tests, leveraging the existing infrastructure from the `packages/db` module.

### Database Strategy Overview

Our e2e testing approach combines:

1. **Dedicated Test Database** - Isolated environment for e2e tests
2. **Permanent Seed Data** - Consistent baseline state between test runs
3. **Transactional Test Isolation** - Clean state for each individual test

### Implementation Details

#### 1. Test Database Setup

```typescript
// Initialize the test database with migrations
await initializeTestDatabase();
```

The test database is configured separately from development and production databases using environment variables. This ensures e2e tests never affect real data.

#### 2. Data Management Approach

- **Baseline Data**: Permanent seed data that represents the application's baseline state
- **Test-Specific Data**: Created and cleaned up for each test using transactions

#### 3. Test Hooks Integration

```typescript
// In your Playwright test file or global setup
import { test as base } from '@playwright/test';
import {
  initializeTestDatabase,
  closeTestConnection,
  executeTestInTransaction
} from '../path/to/db-utils';

// Define custom test fixture with database access
const test = base.extend({
  dbContext: async ({}, use) => {
    // Setup: initialize database before all tests
    await initializeTestDatabase();

    // Provide the database context to the test
    await use({});

    // Teardown: close connection after all tests
    await closeTestConnection();
  }
});

// Example test with transaction
test('should create and verify user data', async ({ page, dbContext }) => {
  // Create test data in a transaction that will be rolled back
  await executeTestInTransaction(async (tx) => {
    // Create test user via repository
    // This data will be automatically rolled back after the test
  });

  // Perform UI interactions that use the test data
  await page.goto('/users');
  // Verify UI elements reflect database state
});
```

### Benefits of This Approach

- **Realistic Testing**: Tests interact with a real database through the entire stack
- **Test Isolation**: Each test runs with clean data, preventing cross-test contamination
- **Performance**: Baseline data is seeded once, reducing setup time
- **Maintainability**: Leverages existing database utilities from `packages/db`
- **Domain Integrity**: Respects the Domain-Driven Design principles of the codebase

### Implementation Steps

1. Create database utilities in `/apps/web/tests/utils/database.ts`
2. Configure Playwright to use these utilities in `playwright.config.ts`
3. Create seed data scripts in `/apps/web/tests/fixtures/`
4. Update e2e tests to use database transactions for test-specific data

### Running E2E Tests with Database Access

```bash
# Run all e2e tests with database access
npm run test:e2e

# Run specific test file
npm run test:e2e -- tests/users.test.ts
```
