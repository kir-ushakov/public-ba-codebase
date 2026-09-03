import { test, expect } from '@playwright/test';
import { setupApiMocks } from './utils/api-mocks.util';
import { createTaskWithTitle, signIn } from './utils/task-flow.util';

test('task stays on home when sync to the server fails', async ({ page }) => {
  await setupApiMocks(page, { failTaskSync: true });
  await signIn(page);

  const postResponse = await createTaskWithTitle(page, 'Unsynced task title');
  expect(postResponse.status()).toBe(500);

  await expect(page.locator('[data-test="task-tile"]', { hasText: 'Unsynced task title' })).toBeVisible();
});
