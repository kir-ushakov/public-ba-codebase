import { test, expect } from '@playwright/test';
import type { SendChangeContract, TaskDTO } from '@brainassistant/contracts';
import { setupApiMocks } from './utils/api-mocks.util';
import { createTaskWithTitle, signIn } from './utils/task-flow.util';

test('user can edit a task title', async ({ page }) => {
  await setupApiMocks(page);
  await signIn(page);
  await createTaskWithTitle(page, 'Original task title');

  await page.locator('[data-test="task-tile"]', { hasText: 'Original task title' }).click();
  await page.waitForURL(/\/task\/TASK_VIEW_MODE_VIEW\//);
  await expect(page.locator('[data-test="task-view-title"]')).toHaveText('Original task title');

  await page.click('[data-test="task-options-btn"]');
  await page.click('[data-test="task-menu-edit"]');
  await page.fill('[data-test="task-title-input"]', 'Edited task title');

  const applyButton = page.locator('[data-test="apply-changes-btn"]');
  await expect(applyButton).toBeEnabled();

  const patchPromise = page.waitForResponse(
    response =>
      response.url().includes('/api/sync/task') && response.request().method() === 'PATCH',
  );
  await applyButton.click();
  const patchResponse = await patchPromise;

  const patchBody = patchResponse.request().postDataJSON() as SendChangeContract.Request<TaskDTO>;
  expect(patchBody.changeableObjectDto).toBeTruthy();
  expect(patchBody.changeableObjectDto.title).toBe('Edited task title');

  await expect(page.locator('[data-test="task-view-title"]')).toHaveText('Edited task title');

  await page.click('[data-test="go-home-btn"]');
  await page.waitForURL(/\/(home)?$/);
  await expect(page.locator('[data-test="task-tile"]', { hasText: 'Edited task title' })).toBeVisible();
  await expect(page.locator('[data-test="task-tile"]', { hasText: 'Original task title' })).toHaveCount(0);
});
