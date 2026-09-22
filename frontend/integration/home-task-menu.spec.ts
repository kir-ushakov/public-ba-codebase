import { test, expect } from '@playwright/test';
import { setupApiMocks } from './utils/api-mocks.util';
import { createTaskWithTitle, signIn } from './utils/task-flow.util';

test('home task menu opens edit and keeps duplicate and tags disabled', async ({ page }) => {
  await setupApiMocks(page);
  await signIn(page);
  await createTaskWithTitle(page, 'Task to edit from home');

  const tile = page.locator('[data-test="task-tile"]', { hasText: 'Task to edit from home' });
  await tile.locator('[data-test="task-tile-more"]').click();

  const menu = page.locator('[data-test="task-tile-menu"]');
  await expect(menu).toBeVisible();
  await expect(page.locator('[data-test="task-tile-menu-duplicate"]')).toBeDisabled();
  await expect(page.locator('[data-test="task-tile-menu-add-to-tags"]')).toBeDisabled();

  await page.click('[data-test="task-tile-menu-edit"]');
  await page.waitForURL(/\/task\/TASK_VIEW_MODE_EDIT\//);
  await expect(page.locator('[data-test="task-title-input"]')).toHaveValue(
    'Task to edit from home',
  );
});

test('home task menu deletes a task', async ({ page }) => {
  await setupApiMocks(page);
  await signIn(page);
  await createTaskWithTitle(page, 'Task to delete from home');

  const tile = page.locator('[data-test="task-tile"]', { hasText: 'Task to delete from home' });
  await tile.locator('[data-test="task-tile-more"]').click();
  await expect(page.locator('[data-test="task-tile-menu"]')).toBeVisible();

  const deletePromise = page.waitForResponse(
    response =>
      response.url().includes('/api/sync/task') && response.request().method() === 'DELETE',
  );
  await page.click('[data-test="task-tile-menu-delete"]');
  await deletePromise;

  await expect(
    page.locator('[data-test="task-tile"]', { hasText: 'Task to delete from home' }),
  ).toHaveCount(0);
});
