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

This project uses a hybrid approach for managing database state in end-to-end tests, leveraging the existing infrastructure from the `packages/db` module.

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
  executeTestInTransaction,
  createTestDataFactories,
  verifyDatabaseState
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

// Example test with transaction and data factories
test('should create and verify user data', async ({ page, dbContext }) => {
  // Create test data in a transaction that will be rolled back
  const { userId } = await executeTestInTransaction(async (tx) => {
    // Use data factories for consistent test data creation
    const factories = createTestDataFactories(tx);
    const user = await factories.users.create({ name: 'Test User' });

    return { userId: user.id };
  });

  // Perform UI interactions that use the test data
  await page.goto('/users');
  await page.getByText('Test User').click();
  await page.getByRole('button', { name: 'Edit' }).click();
  await page.getByLabel('Name').fill('Updated User');
  await page.getByRole('button', { name: 'Save' }).click();

  // Verify database state matches UI actions
  await verifyDatabaseState(async (tx) => {
    const userRepo = createTransactionUserRepository(tx);
    const user = await userRepo.getUserById(userId);
    expect(user.name).toBe('Updated User');
  });
});
```

### Enhanced Testing Utilities

#### 1. Error Assertion Utilities

```typescript
// Extend existing error assertions from DB layer
import { ErrorAssertions } from '@repo/db/tests/test-utils/test-assertions';

// E2E-specific error assertions
export const E2EErrorAssertions = {
  ...ErrorAssertions,
  // Add E2E-specific assertions
  expectValidationErrorInUI: async (page, fieldName) => {
    await expect(page.getByTestId(`error-${fieldName}`)).toBeVisible();
  }
};
```

#### 2. Data Factory Pattern

```typescript
// Create consistent test data factories
export function createTestDataFactories(tx) {
  return {
    users: {
      create: async (overrides = {}) => {
        const userRepo = createTransactionUserRepository(tx);
        return userRepo.createUser({
          email: `user-${Date.now()}@example.com`,
          name: 'Test User',
          status: 'active',
          ...overrides
        });
      }
    }
    // Add more entity factories as needed
  };
}
```

#### 3. Combined UI and Database Operations

```typescript
// Helper to perform UI actions and verify database state
export async function performActionAndVerifyState({ page, uiAction, dbVerification }) {
  // Perform UI action
  await uiAction(page);

  // Verify database state
  await executeTestInTransaction(async (tx) => {
    await dbVerification(tx);
  });
}
```

### Benefits of This Approach

- **Realistic Testing**: Tests interact with a real database through the entire stack
- **Test Isolation**: Each test runs with clean data, preventing cross-test contamination
- **Performance**: Baseline data is seeded once, reducing setup time
- **Maintainability**: Leverages existing database utilities from `packages/db`
- **Domain Integrity**: Respects the Domain-Driven Design principles of the codebase
- **Consistency**: Maintains the same error handling and testing patterns across all layers
- **Readability**: Data factories and helper functions make tests more concise and focused

### Implementation Steps

1. Create database utilities in `/apps/web/tests/utils/database.ts`
2. Implement data factories in `/apps/web/tests/utils/factories.ts`
3. Add error assertion utilities in `/apps/web/tests/utils/assertions.ts`
4. Configure Playwright to use these utilities in `playwright.config.ts`
5. Create seed data scripts in `/apps/web/tests/fixtures/`
6. Document test data dependencies in `/apps/web/tests/fixtures/README.md`
7. Update e2e tests to use database transactions for test-specific data

### Running E2E Tests with Database Access

```bash
# Run all e2e tests with database access
npm run test:e2e

# Run specific test file
npm run test:e2e -- tests/users.test.ts
```
