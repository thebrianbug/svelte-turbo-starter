/**
 * E2E test helpers for database operations
 *
 * This file provides utilities for working with the database in E2E tests,
 * leveraging the transaction-based approach from the test-utils package.
 */
import { executeTestInTransaction, verifyDatabaseState } from '@repo/test-utils';
import type { TransactionType } from '@repo/db';
import type { Page } from '@playwright/test';

/**
 * Verifies database state after UI interactions
 *
 * Use this to check if database changes were properly applied after
 * performing actions in the UI.
 *
 * @example
 * ```ts
 * await verifyAfterAction(async (tx) => {
 *   // Query the database using the transaction
 *   const user = await tx.query.users.findFirst({
 *     where: eq(users.email, 'test@example.com')
 *   });
 *
 *   // Make assertions about the database state
 *   expect(user).not.toBeNull();
 *   expect(user?.name).toBe('Test User');
 * });
 * ```
 */
export async function verifyAfterAction(
  verificationFn: (tx: TransactionType) => Promise<void>
): Promise<void> {
  await verifyDatabaseState(verificationFn);
}

/**
 * Sets up test data before running a test
 *
 * Use this to prepare the database with test data before
 * performing UI actions. Any changes made in the callback
 * will be rolled back after the test completes.
 *
 * @example
 * ```ts
 * const userId = await setupTestData(async (tx) => {
 *   // Create test data using the transaction
 *   const user = await tx.insert(users).values({
 *     name: 'Test User',
 *     email: 'test@example.com'
 *   }).returning().get();
 *
 *   // Return any data needed by the test
 *   return user.id;
 * });
 * ```
 */
export async function setupTestData<T>(setupFn: (tx: TransactionType) => Promise<T>): Promise<T> {
  return executeTestInTransaction(setupFn);
}

/**
 * Combines UI interaction with database verification
 *
 * This helper allows you to perform UI actions and then verify
 * the resulting database state in a single function call.
 *
 * @example
 * ```ts
 * await performActionAndVerify(
 *   // UI action
 *   async (page) => {
 *     await page.fill('[data-testid="name-input"]', 'New User');
 *     await page.fill('[data-testid="email-input"]', 'new@example.com');
 *     await page.click('[data-testid="submit-button"]');
 *     await page.waitForSelector('[data-testid="success-message"]');
 *   },
 *   // Database verification
 *   async (tx) => {
 *     const user = await tx.query.users.findFirst({
 *       where: eq(users.email, 'new@example.com')
 *     });
 *     expect(user).not.toBeNull();
 *     expect(user?.name).toBe('New User');
 *   },
 *   page
 * );
 * ```
 */
export async function performActionAndVerify(
  uiAction: (page: Page) => Promise<void>,
  dbVerification: (tx: TransactionType) => Promise<void>,
  page: Page
): Promise<void> {
  // First perform the UI action
  await uiAction(page);

  // Then verify the database state
  await verifyDatabaseState(dbVerification);
}
