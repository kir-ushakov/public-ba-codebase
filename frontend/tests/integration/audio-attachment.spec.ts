import { expect, test } from '@playwright/test';
import { setupApiMocks } from './utils/api-mocks.util';
import { signIn } from './utils/task-flow.util';

test.use({
  launchOptions: {
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
  },
});

test('saves an audio attachment, transcribes it, and leaves the description until Add', async ({
  page,
}) => {
  await setupApiMocks(page);
  await signIn(page);

  await page.click('[data-test="new-task-btn"]');
  await page.waitForURL('/task/TASK_VIEW_MODE_CREATE');
  await page.fill('[data-test="task-title-input"]', 'Voice task');

  await page.click('[data-test="audio-attachment-add"]');
  const stop = page.locator('[data-test="voice-recorder-apply"]');
  await expect(stop).toBeEnabled();
  await stop.click();

  const card = page.locator('[data-test="audio-attachment-card"]');
  await expect(card).toBeVisible();
  await expect(page.locator('[data-test="task-description-content"]')).not.toContainText(
    'Saved voice note',
  );

  const transcribe = page.waitForResponse(
    response =>
      response.url().includes('/api/ai/speech-to-text') && response.request().method() === 'POST',
  );
  await page.click('[data-test="audio-attachment-transcribe"]');
  await transcribe;

  await page.click('[data-test="audio-attachment-view-transcription"]');
  await expect(page.locator('[data-test="audio-attachment-transcription"]')).toContainText(
    'Saved voice note',
  );
  await expect(page.locator('[data-test="task-description-content"]')).not.toContainText(
    'Saved voice note',
  );

  await page.click('[data-test="audio-attachment-add-to-description"]');
  await expect(page.locator('[data-test="task-description-content"]')).toContainText(
    'Saved voice note',
  );
});
