import { test, expect } from '@playwright/test';
import { setupApiMocks } from './utils/api-mocks.util';
import { createTaskWithTitle, signIn } from './utils/task-flow.util';

/**
 * E2E Test: User can create a task with title and image
 *
 * Stubs used:
 * - e2e/stubs/sign-in-with-google-btn.component.ts - Fake Google authentication
 * - e2e/stubs/device-camera.service.ts - Returns test image from e2e/assets/test-img.jpg
 *
 * Mocks:
 * - All API endpoints (see utils/api-mocks.util.ts)
 */
test('user can create a task', async ({ page }) => {
  await setupApiMocks(page);

  // STEP 0: Authenticate and navigate to Home Screen
  await page.goto('/');
  await expect(page.getByText('Sign in with Google')).toBeVisible();

  // Uses stub sign-in-with-google-btn.component.ts for fake login
  await page.click('text=Sign in with Google');
  await expect(page.getByText('Sign in with Google')).not.toBeVisible();
  await expect(page.locator('[data-test="new-task-btn"]')).toBeVisible();
  await expect(page.locator('[data-test="bottom-nav-home"]')).toBeVisible();
  await expect(page.locator('[data-test="bottom-nav-tasks"]')).toBeVisible();
  await expect(page.locator('[data-test="bottom-nav-tags"]')).toBeVisible();

  // STEP 1: Navigate to Task Creation Screen
  await page.click('[data-test="new-task-btn"]');
  await page.waitForURL('/task/TASK_VIEW_MODE_CREATE');

  // STEP 2: Fill in task details
  await page.fill('[data-test="task-title-input"]', 'My First Task');

  // Uses stub device-camera.service.ts to return test image from e2e/assets/test-img.jpg
  await page.click('[data-test="add-image-btn"]');
  const taskImage = page.locator('[data-test="task-picture"]');
  await expect(taskImage).toBeVisible();

  const imageSrc = await taskImage.getAttribute('src');
  expect(imageSrc).toBeTruthy();
  expect(imageSrc).toContain('blob:');

  // STEP 3: Save task and verify image is uploaded before the task is synced
  const postOrder: string[] = [];
  page.on('request', request => {
    if (request.method() !== 'POST') {
      return;
    }
    if (request.url().includes('/api/files/image')) {
      postOrder.push('image');
    } else if (request.url().includes('/api/sync/task')) {
      postOrder.push('task');
    }
  });

  const imageUploadPromise = page.waitForResponse(
    response =>
      response.url().includes('/api/files/image') && response.request().method() === 'POST',
    { timeout: 30000 },
  );
  const taskSyncPromise = page.waitForResponse(
    response => response.url().includes('/api/sync/task') && response.request().method() === 'POST',
    { timeout: 30000 },
  );

  const applyButton = page.locator('[data-test="apply-changes-btn"]');
  await applyButton.click();

  const imageUploadResponse = await imageUploadPromise;
  const taskSyncResponse = await taskSyncPromise;

  expect(postOrder.indexOf('image')).toBeGreaterThanOrEqual(0);
  expect(postOrder.indexOf('task')).toBeGreaterThan(postOrder.indexOf('image'));

  const taskData = taskSyncResponse.request().postDataJSON();
  expect(taskData.changeableObjectDto).toBeTruthy();
  expect(taskData.changeableObjectDto.title).toBe('My First Task');
  expect(taskData.changeableObjectDto.imageId).toBeTruthy();

  const imageData = imageUploadResponse.request().postData();
  expect(imageData).toBeTruthy();
  expect(imageData!.length).toBeGreaterThan(0);
  expect(imageData!.toString()).toContain(taskData.changeableObjectDto.imageId);

  // STEP 4: Verify task appears on home screen
  await page.waitForURL(/\/(home)?$/);

  const taskTile = page.locator('[data-test="task-tile"]', { hasText: 'My First Task' });
  await expect(taskTile).toBeVisible();

  const taskTileImage = taskTile.locator('img');
  await expect(taskTileImage).toBeVisible();

  const tileImageSrc = await taskTileImage.getAttribute('src');
  expect(tileImageSrc).toBeTruthy();
});

test('title field grows extra lines without overlapping the image control', async ({ page }) => {
  await setupApiMocks(page);
  await signIn(page);

  await page.click('[data-test="new-task-btn"]');
  await page.waitForURL('/task/TASK_VIEW_MODE_CREATE');

  const titleInput = page.locator('[data-test="task-title-input"]');
  const addImageBtn = page.locator('[data-test="add-image-btn"]');
  const applyButton = page.locator('[data-test="apply-changes-btn"]');

  const heightBefore = await titleInput.evaluate(el => el.getBoundingClientRect().height);
  await titleInput.fill(
    'A very long task title that should wrap onto another line on a 375px mobile viewport xx',
  );
  const heightAfter = await titleInput.evaluate(el => el.getBoundingClientRect().height);
  expect(heightAfter).toBeGreaterThan(heightBefore);

  await titleInput.press('Enter');
  await expect(titleInput).toHaveValue(
    'A very long task title that should wrap onto another line on a 375px mobile viewport xx',
  );

  await expect(addImageBtn).toBeVisible();
  await expect(applyButton).toBeVisible();

  const titleBox = await titleInput.boundingBox();
  const imageBox = await addImageBtn.boundingBox();
  const applyBox = await applyButton.boundingBox();
  expect(titleBox).toBeTruthy();
  expect(imageBox).toBeTruthy();
  expect(applyBox).toBeTruthy();
  expect(imageBox!.y).toBeGreaterThan(titleBox!.y + titleBox!.height);
  expect(applyBox!.y).toBeGreaterThan(imageBox!.y + imageBox!.height);
});

test('user can create a task with a one-character title', async ({ page }) => {
  await setupApiMocks(page);
  await signIn(page);

  const postResponse = await createTaskWithTitle(page, 'A');
  const taskData = postResponse.request().postDataJSON();

  expect(taskData.changeableObjectDto.title).toBe('A');
});
