import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:4200',
  },
  // Completely isolate Playwright from other configurations
  testMatch: '**/e2e/**/*.spec.ts',
  testIgnore: [
    '**/tests/**',
    '**/src/**',
  ],
});
