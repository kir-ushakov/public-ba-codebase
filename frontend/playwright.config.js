import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI, // Fail if test.only is left in CI
  retries: process.env.CI ? 2 : 0, // Retry failed tests in CI
  workers: process.env.CI ? 1 : undefined,
  
  reporter: [
    ['html'],
    ['list'],
    ...(process.env.CI ? [['github']] : []), // GitHub Actions annotations
  ],
  
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry', // Collect trace on retry
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  
  // Only start web server locally, not in CI (Docker handles it in CI)
  webServer: process.env.CI ? undefined : {
    command: 'npm run start:e2e',
    url: 'http://localhost:4200',
    reuseExistingServer: true,
    timeout: 120000,
  },
  
  // Run tests in different browsers (optional)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Uncomment to test in other browsers
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],
  
  // Completely isolate Playwright from other configurations
  testMatch: '**/e2e/**/*.spec.ts',
  testIgnore: [
    '**/tests/**',
    '**/src/**',
  ],
});
