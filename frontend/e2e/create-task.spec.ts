import { test, expect } from '@playwright/test';

test('user can create a task', async ({ page }) => {
  await page.goto('/');
  
  // STEP 0: Pass Google Auth and go to Home Screen
  await expect(page.getByText('Sign in with Google')).toBeVisible();
  await page.click('text=Sign in with Google');
  await page.waitForURL('/');
  await expect(page.getByText('Sign in with Google')).not.toBeVisible();
  await expect(page.locator('[data-test="new-task-btn"]')).toBeVisible();
  await page.screenshot({ path: 'test-results/home-screen-after-login.png' });

  // STEP 1: Click on 'New Task Button'
  await page.click('[data-test="new-task-btn"]');
  await page.waitForURL('/task/TASK_VIEW_MODE_CREATE');
  await page.screenshot({ path: 'test-results/task-screen-after-click-new-task-btn.png' });

  // STEP 2.1: Fill in the task title 
  await page.fill('[data-test="task-title-input"]', 'My First Task');
  await page.screenshot({ path: 'test-results/task-screen-after-fill-title.png' });

  // STEP 2.2: Click on 'Add Image Button'
  await page.click('[data-test="add-image-btn"]');
  await page.screenshot({ path: 'test-results/task-screen-after-click-add-image-btn.png' });
  
  // STEP 2.3 Wait for the image to appear and verify it's visible and has a valid src
  const taskImage = page.locator('[data-test="task-picture"]');
  await expect(taskImage).toBeVisible({ timeout: 5000 });
  const imageSrc = await taskImage.getAttribute('src');
  console.log('[E2E Test] Image src:', imageSrc);
  expect(imageSrc).toBeTruthy();
  expect(imageSrc).toContain('blob:'); // Should be a blob URL from our stub
  await page.screenshot({ path: 'test-results/task-screen-after-add-image.png' });

  // STEP 3: Click on 'Apply Button'
  //await page.click('button[type="submit"]');
  //await page.screenshot({ path: 'test-results/task-screen-after-click-apply-btn.png' });

});