import { test, expect } from '@playwright/test';
import { setupApiMocks } from './utils/api-mocks.util';
import { createTaskWithTitle, signIn } from './utils/task-flow.util';

test('user can delete a task', async ({ page }) => {
  await setupApiMocks(page);
  await signIn(page);
  await createTaskWithTitle(page, 'Task to delete');

  await page.locator('[data-test="task-tile"]', { hasText: 'Task to delete' }).click();
  await page.waitForURL(/\/task\/TASK_VIEW_MODE_VIEW\//);

  await page.click('[data-test="task-options-btn"]');

  const deletePromise = page.waitForResponse(
    response =>
      response.url().includes('/api/sync/task') && response.request().method() === 'DELETE',
  );
  await page.click('[data-test="task-menu-delete"]');
  await deletePromise;

  await page.waitForURL(/\/(home)?$/);
  await expect(page.locator('[data-test="task-tile"]', { hasText: 'Task to delete' })).toHaveCount(0);
});
