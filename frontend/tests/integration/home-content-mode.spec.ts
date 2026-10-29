import { test, expect } from '@playwright/test';
import { ETaskStatus, type SendChangeContract, type TaskDTO } from '@brainassistant/contracts';
import { setupApiMocks } from './utils/api-mocks.util';
import { signIn } from './utils/task-flow.util';

test('home opens on Active and switches to the mode of a saved task', async ({ page }) => {
  await setupApiMocks(page);
  await signIn(page);

  await expect(page.locator('[data-test="home-mode-active"]')).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(page.locator('[data-test="home-item-count"]')).toHaveText('0 active items');

  await page.click('[data-test="new-task-btn"]');
  await page.waitForURL('/task/TASK_VIEW_MODE_CREATE');
  await expect(page.locator('[data-test="task-status-active"]')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.fill('[data-test="task-title-input"]', 'Current work');
  const activePost = page.waitForResponse(
    response => response.url().includes('/api/sync/task') && response.request().method() === 'POST',
  );
  await page.click('[data-test="apply-changes-btn"]');
  const activeBody = (await activePost)
    .request()
    .postDataJSON() as SendChangeContract.Request<TaskDTO>;
  expect(activeBody.changeableObjectDto.status).toBe(ETaskStatus.Active);
  await page.waitForURL(/\/(home)?$/);
  await expect(page.locator('[data-test="task-tile"]', { hasText: 'Current work' })).toBeVisible();
  await expect(page.locator('[data-test="home-item-count"]')).toHaveText('1 active item');

  await page.click('[data-test="home-mode-todo"]');
  await page.click('[data-test="new-task-btn"]');
  await page.waitForURL('/task/TASK_VIEW_MODE_CREATE');
  await expect(page.locator('[data-test="task-status-todo"]')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.fill('[data-test="task-title-input"]', 'Write the brief');
  const todoPost = page.waitForResponse(
    response => response.url().includes('/api/sync/task') && response.request().method() === 'POST',
  );
  await page.click('[data-test="apply-changes-btn"]');
  const todoBody = (await todoPost).request().postDataJSON() as SendChangeContract.Request<TaskDTO>;
  expect(todoBody.changeableObjectDto.status).toBe(ETaskStatus.Todo);
  await page.waitForURL(/\/(home)?$/);
  await expect(
    page.locator('[data-test="task-tile"]', { hasText: 'Write the brief' }),
  ).toBeVisible();
  await expect(page.locator('[data-test="home-item-count"]')).toHaveText('1 to do item');

  await page.click('[data-test="home-mode-notes"]');
  await page.click('[data-test="new-task-btn"]');
  await page.waitForURL('/task/TASK_VIEW_MODE_CREATE');
  await page.fill('[data-test="task-title-input"]', 'Saved article');
  await page.click('[data-test="task-status-notes"]');

  const postPromise = page.waitForResponse(
    response => response.url().includes('/api/sync/task') && response.request().method() === 'POST',
  );
  await page.click('[data-test="apply-changes-btn"]');
  const body = (await postPromise).request().postDataJSON() as SendChangeContract.Request<TaskDTO>;
  expect(body.changeableObjectDto.status).toBe(ETaskStatus.Notes);

  await page.waitForURL(/\/(home)?$/);
  await expect(page.locator('[data-test="home-mode-notes"]')).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(page.locator('[data-test="home-item-count"]')).toHaveText('1 note');
  await expect(page.locator('[data-test="home-mode-count-notes"]')).toHaveText('1');
  await expect(page.locator('[data-test="task-tile"]', { hasText: 'Saved article' })).toBeVisible();
  await expect(page.locator('[data-test="task-tile-type-icon"]')).toHaveText('article');

  await page.click('[data-test="home-mode-active"]');
  await expect(page.locator('[data-test="home-item-count"]')).toHaveText('1 active item');
  await expect(page.locator('[data-test="task-tile"]', { hasText: 'Current work' })).toBeVisible();
  await expect(page.locator('[data-test="task-tile"]', { hasText: 'Saved article' })).toHaveCount(
    0,
  );
  await expect(page.locator('[data-test="home-mode-count-notes"]')).toHaveText('1');

  await page.click('[data-test="home-mode-notes"]');
  await expect(page.locator('[data-test="task-tile"]', { hasText: 'Saved article' })).toBeVisible();
});
