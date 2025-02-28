import type { PlaywrightTestConfig } from '@playwright/test';
const config: PlaywrightTestConfig = {
  webServer: {
    command: 'npm run preview',
    port: 3001,
    reuseExistingServer: !process.env.CI,
    cwd: process.cwd(),
    timeout: 120000 // 2 minutes for server startup
  },
  testDir: 'tests',
  testMatch: /(.+\.)?(test|spec)\.[jt]s/,
  timeout: 30000, // 30 seconds per test
  retries: process.env.CI ? 2 : 0, // Retry twice in CI, no retries locally
  reporter: process.env.CI ? 'dot' : 'list', // More concise output in CI
  workers: process.env.CI ? 1 : undefined // Limit parallel tests in CI
};

export default config;
