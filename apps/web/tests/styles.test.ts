import { test, expect } from '@playwright/test';

test('styles should be correctly applied', async ({ page }) => {
  await page.goto('/');

  await test.step('@ui/header styles', async () => {
    const header = page.locator('header');
    const styles = await header.evaluate((el) => window.getComputedStyle(el));

    expect(styles.backgroundColor).toBe('rgb(31, 41, 55)');
    expect(styles.color).toBe('rgb(255, 255, 255)');
  });

  await test.step('@ui/my-counter-button styles', async () => {
    const button = page.locator('button');
    const buttonStyles = await button.evaluate((el) => window.getComputedStyle(el));
    expect(buttonStyles.backgroundColor).toBe('rgb(59, 130, 246)'); // Tailwind blue-500
  });
});
