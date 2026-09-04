import { test, expect } from '@playwright/test';
import {
  createTaskWithTitle,
  loginWithPassword,
  seedVerifiedUser,
} from './utils/live-flow.util';

test('task created on one device appears on the other after sync', async ({ browser }) => {
  const user = await seedVerifiedUser();
  const title = `Live sync task ${Date.now()}`;

  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  try {
    await loginWithPassword(pageA, user.email, user.password);
    await loginWithPassword(pageB, user.email, user.password);

    await createTaskWithTitle(pageA, title);

    await expect(pageB.locator('[data-test="task-tile"]', { hasText: title })).toBeVisible({
      timeout: 30_000,
    });
  } finally {
    await contextA.close();
    await contextB.close();
  }
});
