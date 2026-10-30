import { Page } from '@playwright/test';
import {
  EApiError,
  ERefreshSessionUseCaseError,
  type ApiErrorDto,
  type GetChangesContract,
  type RefreshSessionContract,
  type SendChangeContract,
  type TaskDTO,
  type UploadImageContract,
} from '@brainassistant/contracts';

export type ApiMocks = {
  /** Abort `/api/**` so the app shell can still reload from the dev server. */
  setOffline(offline: boolean): void;
};

export type SetupApiMocksOptions = {
  /** GET /api/sync/changes returns 401; Home shows the signed-in-not-synced banner. */
  unauthorizedChanges?: boolean;
  /** POST /api/sync/task returns 500; the task stays in the client sync queue. */
  failTaskSync?: boolean;
  /** POST /api/files/image returns 500; the task stays queued until a later retry. */
  failImageUpload?: boolean;
};

function json(status: number, body: unknown) {
  return {
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  };
}

function parseSendChangeTask(postData: string | null): TaskDTO | null {
  if (!postData) {
    return null;
  }
  try {
    const body = JSON.parse(postData) as SendChangeContract.Request<TaskDTO>;
    return body.changeableObjectDto ?? null;
  } catch {
    return null;
  }
}

/**
 * Mocks backend API routes so Playwright integration specs run without a live server.
 *
 * Statuses and response bodies must mirror the real backend, which is pinned by the
 * integration specs in `backend/test/integration/`. POST and PATCH `/api/sync/task`
 * return the saved TaskDTO; DELETE answers 200 with no payload.
 */
export async function setupApiMocks(
  page: Page,
  options: SetupApiMocksOptions = {},
): Promise<ApiMocks> {
  let offline = false;
  await page.route('**/api/**', async route => {
    if (offline) {
      await route.abort('internetdisconnected');
      return;
    }

    const request = route.request();
    const url = request.url();
    const method = request.method();

    if (url.includes('/api/auth/refresh') && method === 'POST') {
      if (options.unauthorizedChanges) {
        const body: ApiErrorDto = {
          name: ERefreshSessionUseCaseError.Invalid,
          message: 'Refresh session is invalid',
        };
        await route.fulfill(json(401, body));
        return;
      }
      const body: RefreshSessionContract.Response = { refreshed: true };
      await route.fulfill(json(200, body));
      return;
    }

    if (url.includes('/api/sync/changes') && method === 'GET') {
      if (options.unauthorizedChanges) {
        const body: ApiErrorDto = {
          name: 'USER_NOT_AUTHENTICATED',
          message: 'User not authenticated',
        };
        await route.fulfill(json(401, body));
        return;
      }
      const body: GetChangesContract.Response = { changes: [], syncRevision: 0 };
      await route.fulfill(json(200, body));
      return;
    }

    if (url.includes('/api/sync/task') && method === 'POST') {
      if (options.failTaskSync) {
        const body: ApiErrorDto = { name: EApiError.Unexpected, message: 'sync failed' };
        await route.fulfill(json(500, body));
        return;
      }
      const task = parseSendChangeTask(request.postData());
      const body: SendChangeContract.Response<TaskDTO> = task ?? undefined;
      await route.fulfill(json(201, body ?? {}));
      return;
    }

    if (url.includes('/api/sync/task') && method === 'PATCH') {
      const task = parseSendChangeTask(request.postData());
      const body: SendChangeContract.Response<TaskDTO> = task ?? undefined;
      await route.fulfill(json(200, body ?? {}));
      return;
    }

    if (url.includes('/api/sync/task') && method === 'DELETE') {
      await route.fulfill(json(200, {}));
      return;
    }

    if (url.includes('/api/files/image') && method === 'POST') {
      if (options.failImageUpload) {
        const body: ApiErrorDto = { name: EApiError.Unexpected, message: 'image upload failed' };
        await route.fulfill(json(500, body));
        return;
      }
      const body: UploadImageContract.Response = { imageId: 'mock-uploaded-image-id' };
      await route.fulfill(json(200, body));
      return;
    }

    if (url.includes('/api/files/image') && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'image/jpeg',
        body: Buffer.from([0xff, 0xd8, 0xff, 0xd9]),
      });
      return;
    }

    if (url.includes('/api/auth/logout') && method === 'DELETE') {
      await route.fulfill(json(200, {}));
      return;
    }

    if (url.includes('/api/integrations/google/oauth-consent-screen')) {
      await route.fulfill({
        status: 200,
        contentType: 'text/plain',
        body: 'google-oauth-consent',
      });
      return;
    }

    await route.continue();
  });

  return {
    setOffline(next: boolean): void {
      offline = next;
    },
  };
}
