import { test, expect } from '@playwright/test';

test('tailwind styles are rendered correctly', async ({ page }) => {
  await page.goto('/');

  // Test header background and text color
  const header = page.locator('header');
  const headerStyles = await header.evaluate((el) => {
    const styles = window.getComputedStyle(el);
    return {
      backgroundColor: styles.backgroundColor,
      color: styles.color
    };
  });

  // rgb(31, 41, 55) is the computed value for bg-gray-800
  expect(headerStyles.backgroundColor).toBe('rgb(31, 41, 55)');
  // rgb(255, 255, 255) is computed value for text-white
  expect(headerStyles.color).toBe('rgb(255, 255, 255)');
});
