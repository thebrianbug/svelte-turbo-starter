import type { PlaywrightTestConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// ES modules don't have __dirname, so we need to create it
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config: PlaywrightTestConfig = {
  // Setup and teardown for the test database
  globalSetup: path.resolve(__dirname, './tests/setup/global-setup.ts'),
  globalTeardown: path.resolve(__dirname, './tests/setup/global-teardown.ts'),

  use: {
    launchOptions: {
      args: ['--no-sandbox']
    }
  },
  webServer: {
    command: 'npm run preview',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    cwd: process.cwd()
  },
  testDir: 'tests',
  timeout: 5000,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'dot' : 'list'
};

export default config;
