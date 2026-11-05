import { test, expect, type Page } from '@playwright/test';
import { setupApiMocks } from './utils/api-mocks.util';
import { createTaskWithTitle, signIn } from './utils/task-flow.util';

test('home search filters tiles and cancel restores the list', async ({ page }) => {
  await setupApiMocks(page);
  await signIn(page);
  await createTaskWithTitle(page, 'Buy cat food');
  await createTaskWithTitle(page, 'Lamp photo');

  await expect(page.locator('[data-test="home-item-count"]')).toHaveText('2 active items');

  await page.click('[data-test="home-search"]');
  await expect(page.locator('[data-test="home-search-input"]')).toBeVisible();
  await expect(page.locator('[data-test="home-more"]')).toHaveCount(0);

  await page.fill('[data-test="home-search-input"]', 'cat');

  await expect(page.locator('[data-test="task-tile"]', { hasText: 'Buy cat food' })).toBeVisible();
  await expect(page.locator('[data-test="task-tile"]', { hasText: 'Lamp photo' })).toHaveCount(0);
  await expect(page.locator('[data-test="home-item-count"]')).toHaveText('1 active item');

  await page.click('[data-test="home-search-cancel"]');

  await expect(page.locator('[data-test="home-search-input"]')).toHaveCount(0);
  await expect(page.locator('[data-test="home-search"]')).toBeVisible();
  await expect(page.locator('[data-test="task-tile"]', { hasText: 'Buy cat food' })).toBeVisible();
  await expect(page.locator('[data-test="task-tile"]', { hasText: 'Lamp photo' })).toBeVisible();
});

test('home search updates the count on the neighbouring tab', async ({ page }) => {
  await setupApiMocks(page);
  await signIn(page);
  await createTaskWithTitle(page, 'Buy cat food');
  await createTaskWithTitle(page, 'Lamp photo');
  await page.click('[data-test="home-mode-todo"]');
  await createTaskOnCurrentMode(page, 'Cat litter later');
  await page.click('[data-test="home-mode-active"]');

  await expect(page.locator('[data-test="home-mode-count-active"]')).toHaveText('2');
  await expect(page.locator('[data-test="home-mode-count-todo"]')).toHaveText('1');

  await page.click('[data-test="home-search"]');
  await page.fill('[data-test="home-search-input"]', 'cat');

  await expect(page.locator('[data-test="task-tile"]', { hasText: 'Buy cat food' })).toBeVisible();
  await expect(page.locator('[data-test="task-tile"]', { hasText: 'Lamp photo' })).toHaveCount(0);
  await expect(
    page.locator('[data-test="task-tile"]', { hasText: 'Cat litter later' }),
  ).toHaveCount(0);
  await expect(page.locator('[data-test="home-mode-count-active"]')).toHaveText('1');
  await expect(page.locator('[data-test="home-mode-count-todo"]')).toHaveText('1');
  await expect(page.locator('[data-test="home-item-count"]')).toHaveText('1 active item');

  await page.fill('[data-test="home-search-input"]', 'litter');

  await expect(page.locator('[data-test="home-search-empty"]')).toBeVisible();
  await expect(page.locator('[data-test="home-empty"]')).toHaveCount(0);
  await expect(page.locator('[data-test="home-mode-count-active"]')).toHaveText('0');
  await expect(page.locator('[data-test="home-mode-count-todo"]')).toHaveText('1');

  await page.click('[data-test="home-search-cancel"]');

  await expect(page.locator('[data-test="home-mode-count-active"]')).toHaveText('2');
  await expect(page.locator('[data-test="home-mode-count-todo"]')).toHaveText('1');
});

async function createTaskOnCurrentMode(page: Page, title: string): Promise<void> {
  await page.click('[data-test="new-task-btn"]');
  await page.waitForURL('/task/TASK_VIEW_MODE_CREATE');
  await page.fill('[data-test="task-title-input"]', title);
  const applyButton = page.locator('[data-test="apply-changes-btn"]');
  await expect(applyButton).toBeEnabled();
  await applyButton.click();
  await page.waitForURL(/\/(home)?$/);
  await expect(page.locator('[data-test="task-tile"]', { hasText: title })).toBeVisible();
}
