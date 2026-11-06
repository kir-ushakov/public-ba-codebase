import { test, expect } from '@playwright/test';
import { setupApiMocks } from './utils/api-mocks.util';
import { signIn } from './utils/task-flow.util';

test('voice input is shown when signed in and online, and hidden when offline', async ({
  page,
}) => {
  await setupApiMocks(page);
  await signIn(page);

  await page.click('[data-test="new-task-btn"]');
  await page.waitForURL('/task/TASK_VIEW_MODE_CREATE');

  const voiceInput = page.locator('[data-test="voice-input-trigger"]');
  await expect(voiceInput).toBeVisible();

  await page.context().setOffline(true);
  await expect(voiceInput).toBeHidden();

  await page.context().setOffline(false);
  await expect(voiceInput).toBeVisible();
});

test('voice input is hidden when signed in but not synced, even while online', async ({ page }) => {
  await setupApiMocks(page, { unauthorizedChanges: true });
  await signIn(page);
  await expect(page.locator('[data-test="home-sync-status"]')).toBeVisible();

  await page.click('[data-test="new-task-btn"]');
  await page.waitForURL('/task/TASK_VIEW_MODE_CREATE');

  await expect(page.locator('[data-test="voice-input-trigger"]')).toBeHidden();
});
