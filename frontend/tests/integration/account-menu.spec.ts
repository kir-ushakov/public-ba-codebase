import { test, expect } from '@playwright/test';
import { setupApiMocks } from './utils/api-mocks.util';
import { signIn } from './utils/task-flow.util';

test('account menu opens from the home avatar and goes to profile', async ({ page }) => {
  await setupApiMocks(page);
  await signIn(page);

  await page.click('[data-test="home-avatar"]');
  const menu = page.locator('[data-test="account-menu"]');
  await expect(menu).toBeVisible();
  await expect(menu.getByText('Test User')).toBeVisible();
  await expect(menu.getByText('test@example.com')).toBeVisible();
  await expect(page.locator('[data-test="account-menu-settings"]')).toBeDisabled();
  await expect(page.locator('[data-test="account-menu-integrations"]')).toBeDisabled();

  await page.click('[data-test="account-menu-profile"]');
  await page.waitForURL('/profile');
});

test('account menu sign out logs the user out', async ({ page }) => {
  await setupApiMocks(page);
  await signIn(page);

  await page.click('[data-test="home-avatar"]');
  await expect(page.locator('[data-test="account-menu"]')).toBeVisible();

  const logoutPromise = page.waitForResponse(
    response =>
      response.url().includes('/api/auth/logout') && response.request().method() === 'DELETE',
  );
  await page.click('[data-test="account-menu-sign-out"]');
  await logoutPromise;

  await page.waitForURL('/login');
  await expect(page.getByText('Sign in with Google')).toBeVisible();
});
