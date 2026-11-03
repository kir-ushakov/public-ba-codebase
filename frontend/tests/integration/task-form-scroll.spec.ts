import { expect, test } from '@playwright/test';
import { setupApiMocks } from './utils/api-mocks.util';
import { signIn } from './utils/task-flow.util';

test.use({ viewport: { width: 390, height: 700 } });

test('scrolls the task form without moving the header or footer', async ({ page }) => {
  await setupApiMocks(page);
  await signIn(page);

  await page.click('[data-test="new-task-btn"]');
  await page.waitForURL('/task/TASK_VIEW_MODE_CREATE');

  const content = page.locator('[data-test="task-screen-content"]');
  const header = page.locator('[data-test="create-task-title"]');
  const cancel = page.locator('[data-test="cancel-changes-btn"]');
  const create = page.locator('[data-test="apply-changes-btn"]');

  await expect(header).toBeVisible();
  await expect(header).toHaveText('Create Task');
  await expect(cancel).toBeVisible();
  await expect(create).toBeVisible();

  const metrics = await content.evaluate(element => {
    const style = getComputedStyle(element);
    const thumb = getComputedStyle(element, '::-webkit-scrollbar-thumb');
    const button = getComputedStyle(element, '::-webkit-scrollbar-button');
    const track = getComputedStyle(element, '::-webkit-scrollbar-track');
    return {
      scrollHeight: element.scrollHeight,
      clientHeight: element.clientHeight,
      overflowX: style.overflowX,
      overflowY: style.overflowY,
      overscrollBehavior: style.overscrollBehavior,
      thumb: thumb.backgroundColor,
      buttonDisplay: button.display,
      buttonHeight: button.height,
      track: track.backgroundColor,
    };
  });

  expect(metrics.scrollHeight).toBeGreaterThan(metrics.clientHeight);
  expect(metrics.overflowX).toBe('hidden');
  expect(metrics.overflowY).toBe('auto');
  expect(metrics.overscrollBehavior).toMatch(/^contain(\s+contain)?$/);
  expect(metrics.thumb).toMatch(/100,\s*123,\s*131/);
  expect(metrics.buttonDisplay).toBe('none');
  expect(metrics.buttonHeight).toBe('0px');
  expect(metrics.track).toMatch(/rgba?\(0,\s*0,\s*0,\s*0\)|transparent/);

  const headerBefore = await header.boundingBox();
  const cancelBefore = await cancel.boundingBox();
  const createBefore = await create.boundingBox();

  await content.hover();
  await page.mouse.wheel(0, 500);

  await expect.poll(async () => content.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);

  const headerAfterWheel = await header.boundingBox();
  const cancelAfterWheel = await cancel.boundingBox();
  expect(headerAfterWheel?.y).toBe(headerBefore?.y);
  expect(cancelAfterWheel?.y).toBe(cancelBefore?.y);

  await content.evaluate(element => {
    element.scrollTop = element.scrollHeight;
  });

  const headerAfter = await header.boundingBox();
  const cancelAfter = await cancel.boundingBox();
  const createAfter = await create.boundingBox();
  expect(headerAfter?.y).toBe(headerBefore?.y);
  expect(cancelAfter?.y).toBe(cancelBefore?.y);
  expect(createAfter?.y).toBe(createBefore?.y);
  await expect(page.locator('[data-test="task-tags-section"]')).toBeVisible();
  expect(await page.evaluate(() => window.scrollY)).toBe(0);

  await page.locator('[data-test="task-title-input"]').focus();
  await expect(page.locator('[data-test="task-title-input"]')).toBeInViewport();
  await expect(header).toBeInViewport();
  await expect(create).toBeInViewport();
});
