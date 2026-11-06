import { expect, test } from '@playwright/test';
import { setupApiMocks } from './utils/api-mocks.util';
import { signIn } from './utils/task-flow.util';

test('an offline task survives reload and is sent once the app is online again', async ({
  page,
}) => {
  const api = await setupApiMocks(page);
  await signIn(page);

  api.setOffline(true);
  await page.click('[data-test="new-task-btn"]');
  await page.waitForURL('/task/TASK_VIEW_MODE_CREATE');
  await page.fill('[data-test="task-title-input"]', 'Offline task');
  await page.click('[data-test="apply-changes-btn"]');
  await page.waitForURL(/\/(home)?$/);
  await expect(page.locator('[data-test="task-tile"]', { hasText: 'Offline task' })).toBeVisible();

  await page.reload();
  await expect(page.locator('[data-test="task-tile"]', { hasText: 'Offline task' })).toBeVisible();

  api.setOffline(false);
  const sync = page.waitForResponse(
    response => response.url().includes('/api/sync/task') && response.request().method() === 'POST',
  );
  await page.reload();
  const response = await sync;
  expect(response.request().postDataJSON().changeableObjectDto.title).toBe('Offline task');
  await expect(page.locator('[data-test="task-tile"]', { hasText: 'Offline task' })).toBeVisible();
});
