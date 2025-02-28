import type { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  use: {
    launchOptions: {
      args: ['--no-sandbox']
    }
  },
  webServer: {
    command: 'npm run preview',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    cwd: process.cwd(),
  },
  testDir: 'tests',
  timeout: 5000,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'dot' : 'list'
};

export default config;
