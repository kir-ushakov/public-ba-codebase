import { expect, type Page, type Response } from '@playwright/test';

export async function signIn(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.getByText('Sign in with Google')).toBeVisible();
  await page.click('text=Sign in with Google');
  await expect(page.getByText('Sign in with Google')).not.toBeVisible();
  await expect(page.locator('[data-test="new-task-btn"]')).toBeVisible();
}

export async function createTaskWithTitle(page: Page, title: string): Promise<Response> {
  await page.click('[data-test="new-task-btn"]');
  await page.waitForURL('/task/TASK_VIEW_MODE_CREATE');
  await page.fill('[data-test="task-title-input"]', title);

  const applyButton = page.locator('[data-test="apply-changes-btn"]');
  await expect(applyButton).toBeEnabled();

  const postPromise = page.waitForResponse(
    response => response.url().includes('/api/sync/task') && response.request().method() === 'POST',
  );
  await applyButton.click();
  const postResponse = await postPromise;

  await page.waitForURL(/\/(home)?$/);
  await expect(page.locator('[data-test="task-tile"]', { hasText: title })).toBeVisible();

  return postResponse;
}
