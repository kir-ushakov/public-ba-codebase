import { Application } from 'express';
import request from 'supertest';
import { Result } from '../../../src/shared/core/result.js';
import { OpenAIClientService } from '../../../src/modules/ai/services/open-ai-client.service.js';
import { authenticatedRequest, seedTestUser } from '../_setup/auth.helper.js';
import { buildTestApp } from '../_setup/build-test-app.js';
import { clearDatabase, startInMemoryMongo, stopInMemoryMongo } from '../_setup/mongo-memory.js';

describe('Integration: SpeechToText (Controller -> UseCase -> OpenAI mock)', () => {
  let app: Application;
  let createTranscription: jest.Mock;

  beforeAll(async () => {
    await startInMemoryMongo();
    app = buildTestApp().app;
  }, 30_000);

  afterAll(async () => {
    await stopInMemoryMongo();
  });

  beforeEach(async () => {
    await clearDatabase();
    jest.restoreAllMocks();
    createTranscription = jest.fn().mockResolvedValue({ text: 'hello from whisper' });
    jest.spyOn(OpenAIClientService.prototype, 'getClientOrFail').mockReturnValue(
      Result.ok({
        audio: {
          transcriptions: {
            create: createTranscription,
          },
        },
      } as never),
    );
  });

  it('returns 401 without auth cookie', async () => {
    const res = await request(app)
      .post('/api/ai/speech-to-text')
      .attach('file', Buffer.from('fake-audio'), {
        filename: 'clip.webm',
        contentType: 'audio/webm',
      });

    expect(res.status).toBe(401);
  });

  it('returns transcript when OpenAI succeeds', async () => {
    const { jwtCookie } = await seedTestUser();

    const res = await authenticatedRequest(app, jwtCookie)
      .post('/api/ai/speech-to-text')
      .attach('file', Buffer.from('fake-audio-bytes'), {
        filename: 'clip.webm',
        contentType: 'audio/webm',
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ transcript: 'hello from whisper' });
    expect(createTranscription).toHaveBeenCalledTimes(1);
  });

  it('returns 400 for an unsupported audio mime type', async () => {
    const { jwtCookie } = await seedTestUser();

    const res = await authenticatedRequest(app, jwtCookie)
      .post('/api/ai/speech-to-text')
      .attach('file', Buffer.from('not-audio'), {
        filename: 'notes.txt',
        contentType: 'text/plain',
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('name');
    expect(res.body.message).toContain('Unsupported media type');
    expect(createTranscription).not.toHaveBeenCalled();
  });

  it('returns 502 when OpenAI transcription fails', async () => {
    createTranscription.mockRejectedValue(new Error('openai down'));
    const { jwtCookie } = await seedTestUser();

    const res = await authenticatedRequest(app, jwtCookie)
      .post('/api/ai/speech-to-text')
      .attach('file', Buffer.from('fake-audio-bytes'), {
        filename: 'clip.webm',
        contentType: 'audio/webm',
      });

    expect(res.status).toBe(502);
    expect(res.body).toHaveProperty('name');
    expect(res.body.message).toContain('OpenAI transcription API Request Failed');
  });
});
