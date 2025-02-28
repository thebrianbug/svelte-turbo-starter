import { test, expect } from '@playwright/test';

test.describe('Docs App Home Page', () => {
  test('should display correct heading', async ({ page }) => {
    await page.goto('/');
    const heading = page.getByRole('heading', { name: 'Docs' });
    await expect(heading).toBeVisible();
  });

  test('counter button should increment', async ({ page }) => {
    await page.goto('/');
    const button = page.getByRole('button');

    // Get initial count
    const initialText = await button.textContent();
    expect(initialText).toContain('0');

    // Click and verify increment
    await button.click();
    const updatedText = await button.textContent();
    expect(updatedText).toContain('1');
  });

  test('documentation link should work', async ({ page }) => {
    await page.goto('/');
    const link = page.getByRole('link', { name: 'kit.svelte.dev' });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', 'https://kit.svelte.dev');
  });
});
