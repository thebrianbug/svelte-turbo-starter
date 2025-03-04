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

    // Get initial count
    const initialText = await button.textContent();
    expect(initialText).toBe('clicks: 0');

    // Click and wait for state update
    await button.click();
    // Wait for the button text to update
    await expect(button).toHaveText('clicks: 1', { timeout: 2000 });
  });

  test('documentation link should work', async ({ page }) => {
    await page.goto('/');
    const link = page.getByRole('link', { name: 'kit.svelte.dev' });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', 'https://kit.svelte.dev');
  });
});
