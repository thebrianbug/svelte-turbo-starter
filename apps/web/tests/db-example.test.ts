/**
 * Example E2E test demonstrating database integration
 *
 * This test shows how to use the test-utils package for database operations
 * within Playwright E2E tests, following the project's DDD patterns.
 */
import { test, expect } from '@playwright/test';
import { executeTestInTransaction, verifyDatabaseState } from '@repo/test-utils';
import type { TransactionType } from '@repo/db';
import { createUserRepository } from '@repo/db';
import { createUserService } from '@repo/bll/src/domains/users/factory';

// Test data constants
const TEST_USER = {
  name: 'Test User',
  email: 'test@example.com'
};

const NEW_USER = {
  name: 'New User',
  email: 'new@example.com'
};

const COMBINED_TEST_USER = {
  name: 'Combined Test',
  email: 'combined@example.com'
};

test.describe('Database integration example', () => {
  test('should demonstrate executeTestInTransaction usage', async ({ page }) => {
    // Setup test data before the test using the test-utils package directly
    const testUser = await executeTestInTransaction(async (tx: TransactionType) => {
      // Create a user service with transaction context
      const userService = createUserService({
        repositories: {
          // The repositories property is expected by the factory
          // The transaction context is passed implicitly through the repository
          users: createUserRepository(tx)
        }
      });

      // Create a test user using the service layer
      const user = await userService.createUser({
        name: TEST_USER.name,
        email: TEST_USER.email
      });

      return user;
    });

    // Now we can use the created user in our test
    console.log(`Created test user with ID: ${testUser.id}`);

    // Navigate to the users page
    await page.goto('/users');

    // Verify the user appears in the UI
    await expect(page.getByText(TEST_USER.name)).toBeVisible();
    await expect(page.getByText(TEST_USER.email)).toBeVisible();
  });

  test('should demonstrate verifyDatabaseState usage', async ({ page }) => {
    // Navigate to the user creation page
    await page.goto('/users/new');

    // Fill the form and submit
    await page.fill('[data-testid="name-input"]', NEW_USER.name);
    await page.fill('[data-testid="email-input"]', NEW_USER.email);
    await page.click('[data-testid="submit-button"]');

    // Wait for success message
    await page.waitForSelector('[data-testid="success-message"]');

    // Verify the database state after the action using test-utils directly
    await verifyDatabaseState(async (tx: TransactionType) => {
      // Find the user by email using the repository directly
      const userRepo = createUserRepository(tx);
      const user = await userRepo.findByEmail(NEW_USER.email);

      // Make assertions about the database state
      expect(user).not.toBeNull();
      expect(user?.name).toBe(NEW_USER.name);
    });
  });

  test('should demonstrate combined UI and database verification', async ({ page }) => {
    // Perform UI actions
    await page.goto('/users/new');
    await page.fill('[data-testid="name-input"]', COMBINED_TEST_USER.name);
    await page.fill('[data-testid="email-input"]', COMBINED_TEST_USER.email);
    await page.click('[data-testid="submit-button"]');
    await page.waitForSelector('[data-testid="success-message"]');

    // Then verify database state using test-utils directly
    await verifyDatabaseState(async (tx: TransactionType) => {
      // Find the user by email using the repository directly
      const userRepo = createUserRepository(tx);
      const user = await userRepo.findByEmail(COMBINED_TEST_USER.email);

      // Make assertions about the database state
      expect(user).not.toBeNull();
      expect(user?.name).toBe(COMBINED_TEST_USER.name);
    });
  });
});
