import { test, expect } from '@playwright/test';
import { setupApiMocks } from './utils/api-mocks.util';

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

  // STEP 3: Save task and verify sync to server
  const imageUploadPromise = page.waitForRequest(
    request => request.url().includes('/api/files/image') && request.method() === 'POST',
    { timeout: 30000 }
  );
  
  const taskSyncPromise = page.waitForRequest(
    request => request.url().includes('/api/sync/task') && request.method() === 'POST',
    { timeout: 30000 }
  );
  
  await page.click('[data-test="apply-changes-btn"]');
  
  // Verify image uploaded to server
  const imageUploadRequest = await imageUploadPromise;
  const imageData = imageUploadRequest.postData();
  expect(imageData).toBeTruthy();
  expect(imageData!.length).toBeGreaterThan(0);
  expect(imageData).toContain('imageId');
  
  // Verify task data synced to server
  const taskSyncRequest = await taskSyncPromise;
  const taskData = taskSyncRequest.postDataJSON();
  expect(taskData.changeableObjectDto).toBeTruthy();
  expect(taskData.changeableObjectDto.title).toBe('My First Task');
  expect(taskData.changeableObjectDto.imageId).toBeTruthy();
  
  // STEP 4: Verify task appears on home screen
  await page.waitForURL(/\/(home)?$/);
  
  const taskTile = page.locator('[data-test="task-tile"]', { hasText: 'My First Task' });
  await expect(taskTile).toBeVisible();
  
  const taskTileImage = taskTile.locator('img');
  await expect(taskTileImage).toBeVisible();
  
  const tileImageSrc = await taskTileImage.getAttribute('src');
  expect(tileImageSrc).toBeTruthy();
});