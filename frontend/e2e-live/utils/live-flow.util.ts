import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { expect, request as playwrightRequest, type Page } from '@playwright/test';

function repoRoot(): string {
  const cwd = process.cwd();
  if (fs.existsSync(path.join(cwd, 'docker-compose.smoke.yml'))) {
    return cwd;
  }
  return path.resolve(cwd, '..');
}

const REPO_ROOT = repoRoot();
const COMPOSE_FILE = process.env.SMOKE_COMPOSE_FILE ?? 'docker-compose.smoke.yml';
const COMPOSE_PROJECT = process.env.SMOKE_COMPOSE_PROJECT ?? 'ba-smoke';
const SMOKE_BASE_URL = process.env.SMOKE_BASE_URL ?? 'https://127.0.0.1:3443';

export type SeededUser = {
  email: string;
  password: string;
};

function mongosh(evalJs: string): string {
  return execFileSync(
    'docker',
    [
      'compose',
      '-p',
      COMPOSE_PROJECT,
      '-f',
      COMPOSE_FILE,
      'exec',
      '-T',
      'db',
      'mongosh',
      '--quiet',
      '-u',
      'smoke',
      '-p',
      'smoke-password',
      '--authenticationDatabase',
      'admin',
      'ba',
      '--eval',
      evalJs,
    ],
    { encoding: 'utf8', cwd: REPO_ROOT },
  ).trim();
}

export async function seedVerifiedUser(): Promise<SeededUser> {
  const email = `live-e2e-${Date.now()}@example.com`;
  const password = 'password123';

  const api = await playwrightRequest.newContext({
    baseURL: SMOKE_BASE_URL,
    ignoreHTTPSErrors: true,
  });

  try {
    const signup = await api.post('/api/auth/signup', {
      data: {
        email,
        firstName: 'Live',
        lastName: 'E2E',
        password,
      },
    });
    if (!signup.ok()) {
      throw new Error(`signup failed: ${signup.status()} ${await signup.text()}`);
    }
  } finally {
    await api.dispose();
  }

  mongosh(`db.users.updateOne({ username: '${email}' }, { $set: { verified: true } })`);

  return { email, password };
}

export async function loginWithPassword(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/');
  await page.locator('[data-test="login-email"]').fill(email);
  await page.locator('[data-test="login-password"]').fill(password);
  await page.locator('[data-test="login-submit"]').click();
  await expect(page.locator('[data-test="new-task-btn"]')).toBeVisible();
}

export async function createTaskWithTitle(page: Page, title: string): Promise<void> {
  await page.click('[data-test="new-task-btn"]');
  await page.waitForURL('/task/TASK_VIEW_MODE_CREATE');
  await page.fill('[data-test="task-title-input"]', title);

  const applyButton = page.locator('[data-test="apply-changes-btn"]');
  await expect(applyButton).toBeEnabled();

  const postPromise = page.waitForResponse(
    response =>
      response.url().includes('/api/sync/task') && response.request().method() === 'POST',
  );
  await applyButton.click();
  const post = await postPromise;
  if (!post.ok()) {
    throw new Error(`create task failed: ${post.status()} ${await post.text()}`);
  }

  await page.waitForURL(/\/(home)?$/);
  await expect(page.locator('[data-test="task-tile"]', { hasText: title })).toBeVisible();
}
