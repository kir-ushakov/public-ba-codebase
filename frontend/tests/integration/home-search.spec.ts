import { test, expect } from '@playwright/test';
import { setupApiMocks } from './utils/api-mocks.util';
import { createTaskWithTitle, signIn } from './utils/task-flow.util';

test('home search filters tiles and cancel restores the list', async ({ page }) => {
  await setupApiMocks(page);
  await signIn(page);
  await createTaskWithTitle(page, 'Buy cat food');
  await createTaskWithTitle(page, 'Lamp photo');

  await expect(page.locator('[data-test="home-item-count"]')).toHaveText('2 items');

  await page.click('[data-test="home-search"]');
  await expect(page.locator('[data-test="home-search-input"]')).toBeVisible();
  await expect(page.locator('[data-test="home-more"]')).toHaveCount(0);

  await page.fill('[data-test="home-search-input"]', 'cat');

  await expect(page.locator('[data-test="task-tile"]', { hasText: 'Buy cat food' })).toBeVisible();
  await expect(page.locator('[data-test="task-tile"]', { hasText: 'Lamp photo' })).toHaveCount(0);
  await expect(page.locator('[data-test="home-item-count"]')).toHaveText('2 items');

  await page.click('[data-test="home-search-cancel"]');

  await expect(page.locator('[data-test="home-search-input"]')).toHaveCount(0);
  await expect(page.locator('[data-test="home-search"]')).toBeVisible();
  await expect(page.locator('[data-test="task-tile"]', { hasText: 'Buy cat food' })).toBeVisible();
  await expect(page.locator('[data-test="task-tile"]', { hasText: 'Lamp photo' })).toBeVisible();
});
