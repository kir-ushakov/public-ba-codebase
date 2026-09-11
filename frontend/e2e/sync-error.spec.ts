import { test, expect } from '@playwright/test';
import { setupApiMocks } from './utils/api-mocks.util';
import { createTaskWithTitle, signIn } from './utils/task-flow.util';

test('task stays on home when sync to the server fails', async ({ page }) => {
  await setupApiMocks(page, { failTaskSync: true });
  await signIn(page);

  const postResponse = await createTaskWithTitle(page, 'Unsynced task title');
  expect(postResponse.status()).toBe(500);

  await expect(
    page.locator('[data-test="task-tile"]', { hasText: 'Unsynced task title' }),
  ).toBeVisible();
});

test('task stays on home when image upload fails and is not posted', async ({ page }) => {
  await setupApiMocks(page, { failImageUpload: true });
  await signIn(page);

  await page.click('[data-test="new-task-btn"]');
  await page.waitForURL('/task/TASK_VIEW_MODE_CREATE');
  await page.fill('[data-test="task-title-input"]', 'Photo task waiting for upload');
  await page.click('[data-test="add-image-btn"]');
  await expect(page.locator('[data-test="task-picture"]')).toBeVisible();

  const applyButton = page.locator('[data-test="apply-changes-btn"]');
  await expect(applyButton).toBeEnabled();

  const taskPosts: string[] = [];
  page.on('request', request => {
    if (request.url().includes('/api/sync/task') && request.method() === 'POST') {
      taskPosts.push(request.url());
    }
  });

  const imagePost = page.waitForResponse(
    response =>
      response.url().includes('/api/files/image') && response.request().method() === 'POST',
  );
  await applyButton.click();
  const imageResponse = await imagePost;
  expect(imageResponse.status()).toBe(500);

  await page.waitForURL(/\/(home)?$/);
  await expect(
    page.locator('[data-test="task-tile"]', { hasText: 'Photo task waiting for upload' }),
  ).toBeVisible();
  expect(taskPosts).toEqual([]);
});
