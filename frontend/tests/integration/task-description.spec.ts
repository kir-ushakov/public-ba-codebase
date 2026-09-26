import { test, expect } from '@playwright/test';
import type { SendChangeContract, TaskDTO } from '@brainassistant/contracts';
import { setupApiMocks } from './utils/api-mocks.util';
import { signIn } from './utils/task-flow.util';

test('user can create a task with a description', async ({ page }) => {
  await setupApiMocks(page);
  await signIn(page);

  await page.click('[data-test="new-task-btn"]');
  await page.waitForURL('/task/TASK_VIEW_MODE_CREATE');
  await page.fill('[data-test="task-title-input"]', 'Task with details');

  const editor = page.locator('[data-test="task-description-content"]');
  await editor.click();
  await page.keyboard.type('Contact supplier');
  await editor.press('Control+A');
  await page.locator('[data-test="task-description-bold-btn"]').click();

  const applyButton = page.locator('[data-test="apply-changes-btn"]');
  await expect(applyButton).toBeEnabled();

  const postPromise = page.waitForResponse(
    response => response.url().includes('/api/sync/task') && response.request().method() === 'POST',
  );
  await applyButton.click();
  const postResponse = await postPromise;

  const body = postResponse.request().postDataJSON() as SendChangeContract.Request<TaskDTO>;
  expect(body.changeableObjectDto.title).toBe('Task with details');
  const descriptionJson = JSON.stringify(body.changeableObjectDto.description);
  expect(descriptionJson).toContain('Contact supplier');
  expect(descriptionJson).toContain('"type":"bold"');

  await page.waitForURL(/\/(home)?$/);
  await expect(
    page.locator('[data-test="task-tile"]', { hasText: 'Task with details' }),
  ).toBeVisible();

  await page.locator('[data-test="task-tile"]', { hasText: 'Task with details' }).click();
  await page.waitForURL(/\/task\/TASK_VIEW_MODE_VIEW\//);
  await expect(page.locator('[data-test="task-view-title"]')).toHaveText('Task with details');
  await expect(page.locator('[data-test="task-view-description"]')).toContainText(
    'Contact supplier',
  );
});
