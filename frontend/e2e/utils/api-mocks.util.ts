import { Page } from '@playwright/test';

/**
 * Sets up API route mocks for E2E testing
 * Mocks all backend API endpoints to allow testing without a running backend
 * @param page - Playwright page instance
 */
export async function setupApiMocks(page: Page): Promise<void> {
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = request.url();
    const method = request.method();
    
    if (url.includes('/api/sync/task') && method === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    } else if (url.includes('/api/client-id')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ clientId: 'mock-client-id-123' })
      });
    } else if (url.includes('/api/server-changes')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    } else if (url.includes('/api/sync/release-client-id')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ clientId: 'mock-released-client-id' })
      });
    } else if (url.includes('/api/sync/changes')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    } else if (url.includes('/api/files/image') && method === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ imageId: 'mock-uploaded-image-id' })
      });
    } else {
      await route.continue();
    }
  });
}

