import { test, expect } from '@playwright/test';

test.describe('Web App Home Page', () => {
  test('should display correct heading', async ({ page }) => {
    await page.goto('/');
    const heading = page.getByRole('heading', { name: 'Web' });
    await expect(heading).toBeVisible();
  });

  test('counter button should increment', async ({ page }) => {
    await page.goto('/');
    const button = page.getByRole('button');
    await expect(button).toHaveText('clicks: 0');
    await button.click();
    await expect(button).toHaveText('clicks: 1');
  });

  test('documentation link should work', async ({ page }) => {
    await page.goto('/');
    const link = page.getByRole('link', { name: 'kit.svelte.dev', exact: true });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', 'https://kit.svelte.dev');
  });
});
