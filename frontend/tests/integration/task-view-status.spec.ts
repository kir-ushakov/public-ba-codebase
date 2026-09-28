import { test, expect } from '@playwright/test';
import { ETaskStatus, type SendChangeContract, type TaskDTO } from '@brainassistant/contracts';
import { setupApiMocks } from './utils/api-mocks.util';
import { createTaskWithTitle, signIn } from './utils/task-flow.util';

test('user can mark a viewed task active and then done', async ({ page }) => {
  await setupApiMocks(page);
  await signIn(page);
  await createTaskWithTitle(page, 'Buy cat food');

  await page.locator('[data-test="task-tile"]', { hasText: 'Buy cat food' }).click();
  await page.waitForURL(/\/task\/TASK_VIEW_MODE_VIEW\//);

  const markActive = page.locator('[data-test="mark-task-active-btn"]');
  const markDone = page.locator('[data-test="mark-task-done-btn"]');
  await expect(markActive).toBeVisible();
  await expect(markActive).toContainText('Mark as Active');
  await expect(markDone).toBeVisible();
  await expect(markDone).toContainText('Done');

  const activePatch = page.waitForResponse(
    response =>
      response.url().includes('/api/sync/task') && response.request().method() === 'PATCH',
  );
  await markActive.click();
  const activeBody = (await activePatch)
    .request()
    .postDataJSON() as SendChangeContract.Request<TaskDTO>;
  expect(activeBody.changeableObjectDto.status).toBe(ETaskStatus.Active);
  await page.waitForURL(/\/(home)?$/);
  await expect(page.locator('[data-test="task-tile"]', { hasText: 'Buy cat food' })).toBeVisible();

  await page.locator('[data-test="task-tile"]', { hasText: 'Buy cat food' }).click();
  await page.waitForURL(/\/task\/TASK_VIEW_MODE_VIEW\//);
  await expect(page.locator('[data-test="mark-task-active-btn"]')).toHaveCount(0);
  await expect(markDone).toBeVisible();

  const donePatch = page.waitForResponse(
    response =>
      response.url().includes('/api/sync/task') && response.request().method() === 'PATCH',
  );
  await markDone.click();
  const doneBody = (await donePatch)
    .request()
    .postDataJSON() as SendChangeContract.Request<TaskDTO>;
  expect(doneBody.changeableObjectDto.status).toBe(ETaskStatus.Done);
  await page.waitForURL(/\/(home)?$/);
  await expect(page.locator('[data-test="task-tile"]', { hasText: 'Buy cat food' })).toHaveCount(0);
});
