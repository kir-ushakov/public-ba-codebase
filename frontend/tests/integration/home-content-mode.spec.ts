import { test, expect, type Page } from '@playwright/test';
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
  await expect(page.locator('[data-test="home-empty-title"]')).toHaveText(
    'Nothing active right now.',
  );
  await expect(page.locator('[data-test="home-empty-art"] use')).toHaveAttribute(
    'href',
    /empty-states\.svg#empty-active$/,
  );
  await expect(page.locator('[data-test="new-task-btn"]')).toBeVisible();

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
  await expect(page.locator('[data-test="home-empty"]')).toHaveCount(0);
  await expect(page.locator('[data-test="home-item-count"]')).toHaveText('1 active item');

  await page.click('[data-test="home-mode-todo"]');
  await expect(page.locator('[data-test="home-empty-title"]')).toHaveText(
    'Your to-do list is empty.',
  );
  await expect(page.locator('[data-test="home-empty-art"] use')).toHaveAttribute(
    'href',
    /empty-states\.svg#empty-todo$/,
  );
  await expect(page.locator('[data-test="task-tile"]', { hasText: 'Current work' })).toHaveCount(0);
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
  expect(todoBody.changeableObjectDto.conditions).toEqual(['TASK_CONDITION_TODO']);
  await page.waitForURL(/\/(home)?$/);
  await expect(
    page.locator('[data-test="task-tile"]', { hasText: 'Write the brief' }),
  ).toBeVisible();
  await expect(page.locator('[data-test="home-item-count"]')).toHaveText('1 to do item');

  await page.click('[data-test="home-category-selector"]');
  await expect(page.locator('[data-test="home-mode-option-todo"]')).toHaveCount(0);
  await expect(page.locator('[data-test="home-mode-option-waiting"]')).toBeVisible();
  await expect(page.locator('[data-test="home-mode-option-notes"]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-test="home-category-menu"]')).toHaveCount(0);
  await chooseHomeCategory(page, 'waiting');
  await expect(page.locator('[data-test="home-empty-title"]')).toHaveText('Nothing is waiting.');
  await page.click('[data-test="new-task-btn"]');
  await page.waitForURL('/task/TASK_VIEW_MODE_CREATE');
  await expect(page.locator('[data-test="task-condition-calendar"]')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.locator('[data-test="task-condition-todo"]')).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  await page.fill('[data-test="task-title-input"]', 'Buy lemons');
  const waitingPost = page.waitForResponse(
    response => response.url().includes('/api/sync/task') && response.request().method() === 'POST',
  );
  await page.click('[data-test="apply-changes-btn"]');
  const waitingBody = (await waitingPost)
    .request()
    .postDataJSON() as SendChangeContract.Request<TaskDTO>;
  expect(waitingBody.changeableObjectDto.status).toBe(ETaskStatus.Todo);
  expect(waitingBody.changeableObjectDto.conditions).toEqual(['TASK_CONDITION_CALENDAR']);
  await page.waitForURL(/\/(home)?$/);
  await expect(page.locator('[data-test="home-mode-waiting"]')).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(page.locator('[data-test="task-tile"]', { hasText: 'Buy lemons' })).toBeVisible();
  await chooseHomeCategory(page, 'todo');
  await expect(page.locator('[data-test="task-tile"]', { hasText: 'Buy lemons' })).toHaveCount(0);
  await expect(
    page.locator('[data-test="task-tile"]', { hasText: 'Write the brief' }),
  ).toBeVisible();

  await chooseHomeCategory(page, 'notes');
  await expect(page.locator('[data-test="home-empty-title"]')).toHaveText('No notes yet.');
  await expect(page.locator('[data-test="home-empty-art"] use')).toHaveAttribute(
    'href',
    /empty-states\.svg#empty-notes$/,
  );
  await page.click('[data-test="new-task-btn"]');
  await page.waitForURL('/task/TASK_VIEW_MODE_CREATE');
  await expect(page.locator('[data-test="create-note-title"]')).toHaveText('Create Note');
  await expect(page.locator('[data-test="task-status-section"]')).toHaveCount(0);
  await expect(page.locator('[data-test="task-title-input"]')).toHaveAttribute(
    'placeholder',
    'Note title here...',
  );
  await page.fill('[data-test="task-title-input"]', 'Saved article');
  await expect(page.locator('[data-test="apply-changes-btn"]')).toHaveText('Create Note');

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
  await expect(page.locator('[data-test="home-empty"]')).toHaveCount(0);
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

test('category labels stay fully visible on narrow screens', async ({ page }) => {
  await setupApiMocks(page);
  await signIn(page);

  for (const width of [320, 375, 390]) {
    await page.setViewportSize({ width, height: 800 });
    await expectCategoryRowFits(page);
    await expect(page.locator('[data-test="home-mode-active"]')).toContainText('Active');
    await expect(page.locator('[data-test="home-mode-todo"]')).toContainText('To do');
  }

  await page.setViewportSize({ width: 320, height: 800 });
  await chooseHomeCategory(page, 'waiting');
  await expectCategoryRowFits(page);
  await expect(page.locator('[data-test="home-mode-waiting"]')).toContainText('Waiting');

  await chooseHomeCategory(page, 'notes');
  await expectCategoryRowFits(page);
  await expect(page.locator('[data-test="home-mode-notes"]')).toContainText('Notes');
});

async function chooseHomeCategory(page: Page, mode: 'todo' | 'waiting' | 'notes'): Promise<void> {
  const tab = page.locator(`[data-test="home-mode-${mode}"]`);
  if ((await tab.count()) > 0) {
    await tab.click();
    return;
  }

  await page.click('[data-test="home-category-selector"]');
  await page.click(`[data-test="home-mode-option-${mode}"]`);
}

async function expectCategoryRowFits(page: Page): Promise<void> {
  const nav = page.locator('[data-test="home-content-mode"]');
  await expect(nav).toBeVisible();
  const overflows = await nav.evaluate(el => el.scrollWidth > el.clientWidth + 1);
  expect(overflows).toBe(false);

  const selector = page.locator('[data-test="home-category-selector"]');
  const selectorBox = await selector.boundingBox();
  expect(selectorBox?.width).toBeGreaterThanOrEqual(44);
  expect(selectorBox?.height).toBeGreaterThanOrEqual(44);

  for (const tab of await page.locator('[data-test="home-content-mode"] [role="tab"]').all()) {
    const clipped = await tab.evaluate(el => el.scrollWidth > el.clientWidth + 1);
    expect(clipped).toBe(false);
  }
}
