import { Page } from '@playwright/test';
import {
  EApiError,
  EUploadImageUseCaseError,
  type ApiErrorDto,
  type GetChangesContract,
  type SendChangeContract,
  type TaskDTO,
  type UploadImageContract,
} from '@brainassistant/contracts';

export type SetupApiMocksOptions = {
  /** POST /api/sync/task returns 500; the task stays in the client sync queue. */
  failTaskSync?: boolean;
  /** POST /api/files/image returns 403 Google refresh token invalid. */
  failGoogleRefreshToken?: boolean;
  /** POST /api/files/image returns 500; the task stays queued until a later retry. */
  failImageUpload?: boolean;
};

type ReleaseClientIdResponse = { clientId: string };

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
 * Mocks backend API routes so E2E specs run without a live server.
 *
 * Statuses and response bodies must mirror the real backend, which is pinned by the
 * integration specs in `backend/test/integration/`. POST and PATCH `/api/sync/task`
 * return the saved TaskDTO; DELETE answers 200 with no payload.
 */
export async function setupApiMocks(page: Page, options: SetupApiMocksOptions = {}): Promise<void> {
  await page.route('**/api/**', async route => {
    const request = route.request();
    const url = request.url();
    const method = request.method();

    if (url.includes('/api/sync/release-client-id')) {
      const body: ReleaseClientIdResponse = { clientId: 'mock-client-id-123' };
      await route.fulfill(json(200, body));
      return;
    }

    if (url.includes('/api/sync/changes') && method === 'GET') {
      const body: GetChangesContract.Response = { changes: [] };
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
      if (options.failGoogleRefreshToken) {
        const body: ApiErrorDto = {
          name: EUploadImageUseCaseError.GoogleRefreshTokenInvalid,
          message: 'Google refresh token is invalid or revoked',
        };
        await route.fulfill(json(403, body));
        return;
      }
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
}
