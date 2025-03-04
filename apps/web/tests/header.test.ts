import { expect, test } from '@playwright/test';

test.describe('Header Navigation', () => {
  test('should navigate between pages', async ({ page }) => {
    // Start at home page
    await page.goto('/');
    await expect(page).toHaveURL('/');

    // Navigate to users page
    await page.getByRole('link', { name: 'Users' }).click();
    await expect(page).toHaveURL('/users');

    // Navigate back to home
    await page.getByRole('link', { name: 'Home' }).click();
    await expect(page).toHaveURL('/');
  });

  test('should highlight active link', async ({ page }) => {
    // Check home page active state
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Home' })).toHaveClass(/active/);

    // Check users page active state
    await page.goto('/users');
    await expect(page.getByRole('link', { name: 'Users' })).toHaveClass(/active/);
  });
});
