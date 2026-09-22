import { test, expect } from '@playwright/test';
import { setupApiMocks } from './utils/api-mocks.util';
import { signIn } from './utils/task-flow.util';

test('signed-in not-synced banner opens the sync screen', async ({ page }) => {
  await setupApiMocks(page, { unauthorizedChanges: true });
  await signIn(page);

  const banner = page.locator('[data-test="home-sync-status"]');
  await expect(banner).toBeVisible();
  await expect(banner.getByText('Signed in, not synced')).toBeVisible();

  await page.click('[data-test="home-sync-now"]');
  await page.waitForURL('/sync');
});
