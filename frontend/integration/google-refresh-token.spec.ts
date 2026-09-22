import { test, expect } from '@playwright/test';
import { setupApiMocks } from './utils/api-mocks.util';
import { signIn } from './utils/task-flow.util';

test('invalid Google refresh token on image upload opens consent', async ({ page }) => {
  await setupApiMocks(page, { failGoogleRefreshToken: true });
  await signIn(page);

  await page.click('[data-test="new-task-btn"]');
  await page.waitForURL('/task/TASK_VIEW_MODE_CREATE');
  await page.fill('[data-test="task-title-input"]', 'Task needing Google reconnect');
  await page.click('[data-test="add-image-btn"]');
  await expect(page.locator('[data-test="task-picture"]')).toBeVisible();

  const uploadPromise = page.waitForResponse(
    response =>
      response.url().includes('/api/files/image') && response.request().method() === 'POST',
    { timeout: 30000 },
  );

  await page.locator('[data-test="apply-changes-btn"]').click();
  const uploadResponse = await uploadPromise;
  expect(uploadResponse.status()).toBe(403);

  await page.waitForURL(/oauth-consent-screen/);
});
