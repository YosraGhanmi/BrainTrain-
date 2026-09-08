import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.BASE_URL || 'http://localhost:3000';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45_000,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL,
    channel: 'msedge',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 20_000,
  },
  projects: [
    {
      name: 'mobile-390',
      use: { ...devices['Desktop Edge'], channel: 'msedge', viewport: { width: 390, height: 844 } },
    },
    {
      name: 'tablet-820',
      use: { ...devices['Desktop Edge'], channel: 'msedge', viewport: { width: 820, height: 1180 } },
    },
    {
      name: 'desktop-1440',
      use: { ...devices['Desktop Edge'], channel: 'msedge', viewport: { width: 1440, height: 900 } },
    },
  ],
});
