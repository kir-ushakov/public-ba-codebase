import { Page } from '@playwright/test';
import type {
  ApiErrorDto,
  GetChangesContract,
  SendChangeContract,
  TaskDTO,
  UploadImageContract,
} from '@brainassistant/contracts';

export type SetupApiMocksOptions = {
  /** POST /api/sync/task returns 500; the task stays in the client sync queue. */
  failTaskSync?: boolean;
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
 * integration specs in `backend/test/integration/`. Only `POST /api/sync/task` returns
 * an entity; update and delete answer 200 with no payload.
 */
export async function setupApiMocks(
  page: Page,
  options: SetupApiMocksOptions = {},
): Promise<void> {
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
        const body: ApiErrorDto = { name: 'InternalError', message: 'sync failed' };
        await route.fulfill(json(500, body));
        return;
      }
      const task = parseSendChangeTask(request.postData());
      const body: SendChangeContract.Response<TaskDTO> = task ?? undefined;
      await route.fulfill(json(201, body ?? {}));
      return;
    }

    if (url.includes('/api/sync/task') && method === 'PATCH') {
      await route.fulfill(json(200, {}));
      return;
    }

    if (url.includes('/api/sync/task') && method === 'DELETE') {
      await route.fulfill(json(200, {}));
      return;
    }

    if (url.includes('/api/files/image') && method === 'POST') {
      const body: UploadImageContract.Response = { imageId: 'mock-uploaded-image-id' };
      await route.fulfill(json(200, body));
      return;
    }

    await route.continue();
  });
}
