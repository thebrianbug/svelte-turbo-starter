import type { PlaywrightTestConfig } from '@playwright/test';
const config: PlaywrightTestConfig = {
  webServer: {
    command: 'npm run preview',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    cwd: process.cwd(),
    timeout: 10000 // server startup is almost instant, do not increase
  },
  testDir: 'tests',
  testMatch: /(.+\.)?(test|spec)\.[jt]s/,
  timeout: 5000, // Should be almost instant
  retries: process.env.CI ? 2 : 0, // Retry twice in CI, no retries locally
  reporter: process.env.CI ? 'dot' : 'list', // More concise output in CI
  workers: process.env.CI ? 1 : undefined // Limit parallel tests in CI
};

export default config;
