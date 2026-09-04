import { defineConfig, devices } from '@playwright/test';

/**
 * Live two-client e2e against the smoke Docker backend.
 * Does not use the mocked `e2e/` suite or `start:e2e` stubs.
 */
export default defineConfig({
  testDir: './e2e-live',
  timeout: 90_000,
  expect: { timeout: 30_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [
    ['html', { outputFolder: 'playwright-report-live' }],
    ['list'],
    ...(process.env.CI ? [['github']] : []),
  ],
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run start:live-e2e',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'live-chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 375, height: 667 },
      },
    },
  ],
  testMatch: '**/*.spec.ts',
});
