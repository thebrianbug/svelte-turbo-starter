import { test, expect } from '@playwright/test';

test('tailwind styles are rendered correctly', async ({ page }) => {
  await page.goto('/');

  // Test heading font size and color
  const heading = page.locator('h1');
  const headingStyles = await heading.evaluate((el) => {
    const styles = window.getComputedStyle(el);
    return {
      fontSize: styles.fontSize,
      color: styles.color
    };
  });

  // 36px is computed value for text-4xl (2.25rem)
  expect(headingStyles.fontSize).toBe('36px');
  // rgb(17, 24, 39) is computed value for text-gray-900
  expect(headingStyles.color).toBe('rgb(17, 24, 39)');
});
