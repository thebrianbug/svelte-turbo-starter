import { expect, test } from '@playwright/test';

test.describe('Users Page', () => {
  test('should display users page heading', async ({ page }) => {
    await page.goto('/users');
    const heading = await page.getByRole('heading', { name: 'Users' });
    await expect(heading).toBeVisible();
  });
});
