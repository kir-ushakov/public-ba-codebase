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
    isPinned: false,
  });

  await expect(page.locator('[data-test="bottom-sheet"]')).toHaveCount(0);
  await expect(page.locator('[data-test="tags-other-section"]')).toContainText('Work');
  await expect(page.locator('[data-test="tags-pinned-section"]')).toHaveCount(0);

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

  await page.click('[data-test="bottom-nav-home"]');
  const chip = page.locator('[data-test="home-pinned-tag"]', { hasText: 'Work' });
  await expect(chip).toBeVisible();
  await expect(chip).toHaveAttribute('aria-pressed', 'false');

  await chip.click();
  await expect(chip).toHaveAttribute('aria-pressed', 'true');
  await chip.click();
  await expect(chip).toHaveAttribute('aria-pressed', 'false');
});
