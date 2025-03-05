import { test, expect } from '@playwright/test';

test('heading should have correct Tailwind styles', async ({ page }) => {
  await page.goto('/');
  const heading = page.locator('h1');
  const styles = await heading.evaluate((el) => window.getComputedStyle(el));

  expect(styles.fontSize).toBe('36px');
  expect(styles.color).toBe('rgb(17, 24, 39)');
});
