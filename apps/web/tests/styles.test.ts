import { test, expect } from '@playwright/test';

test('header should have correct Tailwind styles', async ({ page }) => {
  await page.goto('/');
  const header = page.locator('header');
  const styles = await header.evaluate((el) => window.getComputedStyle(el));

  expect(styles.backgroundColor).toBe('rgb(31, 41, 55)');
  expect(styles.color).toBe('rgb(255, 255, 255)');
});
