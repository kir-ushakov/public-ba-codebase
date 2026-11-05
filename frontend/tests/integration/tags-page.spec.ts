import { expect, test } from '@playwright/test';
import { setupApiMocks } from './utils/api-mocks.util';
import { signIn } from './utils/task-flow.util';

test('creates a tag, pins it, and uses it as a Home filter', async ({ page }) => {
  await setupApiMocks(page);
  await signIn(page);

  await page.click('[data-test="bottom-nav-tags"]');
  await expect(page.locator('[data-test="tags-title"]')).toHaveText('Tags');
  await expect(page.locator('[data-test="tags-empty"]')).toHaveText('No tags yet');
  await expect(page.locator('[data-test="bottom-nav-tags"]')).toHaveAttribute(
    'aria-current',
    'page',
  );

  await page.click('[data-test="tags-create"]');
  await expect(page.locator('[data-test="bottom-sheet-title"]')).toHaveText('Create new tag');
  await page.fill('[data-test="new-tag-name"]', 'Work');

  const created = page.waitForResponse(
    response => response.url().includes('/api/sync/tag') && response.request().method() === 'POST',
  );
  await page.click('[data-test="new-tag-submit"]');
  const createResponse = await created;
  expect(createResponse.status()).toBe(201);
  expect(createResponse.request().postDataJSON().changeableObjectDto).toMatchObject({
    name: 'Work',
    color: '#00a991',
    isPinned: false,
  });

  await expect(page.locator('[data-test="bottom-sheet"]')).toHaveCount(0);
  await expect(page.locator('[data-test="tags-other-section"]')).toContainText('Work');
  await expect(page.locator('[data-test="tags-pinned-section"]')).toHaveCount(0);
  await expect(page.locator('[data-test="tag-pin-icon"]')).toHaveText('keep_off');

  await page.click('[data-test="tags-search"]');
  await page.fill('[data-test="tags-search-input"]', 'nope');
  await expect(page.locator('[data-test="tags-search-empty"]')).toHaveText('No results');
  await page.click('[data-test="tags-search-cancel"]');

  const pinned = page.waitForResponse(
    response => response.url().includes('/api/sync/tag') && response.request().method() === 'PATCH',
  );
  await page.locator('[data-test="tag-pin"]').click();
  const pinResponse = await pinned;
  expect(pinResponse.status()).toBe(200);
  expect(pinResponse.request().postDataJSON().changeableObjectDto.isPinned).toBe(true);

  await expect(page.locator('[data-test="tags-pinned-section"]')).toContainText('Work');
  await expect(page.locator('[data-test="tags-pinned-section"]')).toContainText('Shown on Home');
  await expect(page.locator('[data-test="tags-other-section"]')).toHaveCount(0);
  await expect(page.locator('[data-test="tag-pin"]')).toHaveAttribute('aria-label', 'Unpin tag');
  await expect(page.locator('[data-test="tag-pin"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-test="tag-pin-icon"]')).toHaveText('push_pin');

  await page.click('[data-test="bottom-nav-home"]');
  const chip = page.locator('[data-test="home-pinned-tag"]', { hasText: 'Work' });
  await expect(chip).toBeVisible();
  await expect(chip.locator('[data-test="home-tag-pin"]')).toHaveText('push_pin');
  await expect(chip).toHaveAttribute('aria-pressed', 'false');

  await chip.click();
  await expect(chip).toHaveAttribute('aria-pressed', 'true');
  await chip.click();
  await expect(chip).toHaveAttribute('aria-pressed', 'false');
});

test('renames a tag, changes its color, and deletes it without removing tasks', async ({
  page,
}) => {
  await setupApiMocks(page);
  await signIn(page);

  await page.click('[data-test="bottom-nav-tags"]');
  await page.click('[data-test="tags-create"]');
  await page.fill('[data-test="new-tag-name"]', 'Home');
  const created = page.waitForResponse(
    response => response.url().includes('/api/sync/tag') && response.request().method() === 'POST',
  );
  await page.click('[data-test="new-tag-submit"]');
  await created;
  await expect(page.locator('[data-test="tags-other-section"]')).toContainText('Home');

  await page.click('[data-test="tag-more"]');
  await page.click('[data-test="tag-menu-edit"]');
  await expect(page.locator('[data-test="bottom-sheet-title"]')).toHaveText('Edit tag');
  await expect(page.locator('[data-test="new-tag-name"]')).toHaveValue('Home');
  await page.fill('[data-test="new-tag-name"]', 'House');
  await page.locator('[data-test="tag-color"][aria-label="#9b8ad0"]').click();
  await expect(page.locator('[data-test="tag-preview"]')).toContainText('House');

  const updated = page.waitForResponse(
    response => response.url().includes('/api/sync/tag') && response.request().method() === 'PATCH',
  );
  await page.click('[data-test="new-tag-submit"]');
  const updateResponse = await updated;
  expect(updateResponse.request().postDataJSON().changeableObjectDto).toMatchObject({
    name: 'House',
    color: '#9b8ad0',
  });

  await expect(page.locator('[data-test="bottom-sheet"]')).toHaveCount(0);
  await expect(page.locator('[data-test="tags-other-section"]')).toContainText('House');
  await expect(page.locator('[data-test="tag-sell"]')).toHaveCSS('color', 'rgb(155, 138, 208)');

  await page.click('[data-test="tag-more"]');
  await page.click('[data-test="tag-menu-delete"]');
  await expect(page.locator('[data-test="delete-tag-title"]')).toHaveText('Delete tag?');
  await expect(page.locator('[data-test="delete-tag-message"]')).toContainText(
    'removed from 0 tasks',
  );

  const deleted = page.waitForResponse(
    response =>
      response.url().includes('/api/sync/tag') && response.request().method() === 'DELETE',
  );
  await page.click('[data-test="delete-tag-confirm"]');
  expect((await deleted).status()).toBe(200);
  await expect(page.locator('[data-test="tags-empty"]')).toHaveText('No tags yet');
});
