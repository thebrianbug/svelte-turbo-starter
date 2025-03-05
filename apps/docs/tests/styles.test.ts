import { test, expect } from '@playwright/test';

test('styles should be correctly applied', async ({ page }) => {
  await page.goto('/');

  await test.step('local lib: heading styles', async () => {
    const heading = page.locator('h1');
    const styles = await heading.evaluate((el) => window.getComputedStyle(el));

    expect(styles.fontSize).toBe('36px');
    expect(styles.color).toBe('rgb(17, 24, 39)');
  });

  await test.step('@ui/my-counter-button styles', async () => {
    const button = page.locator('button');
    const buttonStyles = await button.evaluate((el) => window.getComputedStyle(el));
    expect(buttonStyles.backgroundColor).toBe('rgb(59, 130, 246)'); // Tailwind blue-500
  });
});
