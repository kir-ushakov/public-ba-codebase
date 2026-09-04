import { Application } from 'express';
import request from 'supertest';
import { ETaskStatus, ETaskType } from '@brainassistant/contracts';
import UserModel from '../../../src/shared/infra/database/mongodb/user.model.js';
import {
  authenticatedRequest,
  jwtCookieFromResponse,
  seedTestUser,
} from '../_setup/auth.helper.js';
import { buildTestApp } from '../_setup/build-test-app.js';
import {
  fakeGoogleSuccess,
  installFakeGoogleStrategy,
} from '../_setup/fake-google.strategy.js';
import { clearDatabase, startInMemoryMongo, stopInMemoryMongo } from '../_setup/mongo-memory.js';

const AUTH_PATH = '/api/integrations/google/auth';

describe('Integration: GoogleAuth (Controller -> UseCase -> Repo -> MongoDB)', () => {
  let app: Application;

  beforeAll(async () => {
    await startInMemoryMongo();
    app = buildTestApp().app;
  }, 30_000);

  afterAll(async () => {
    await stopInMemoryMongo();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  it('creates a verified Google user, sets a jwt cookie, and can create a task', async () => {
    installFakeGoogleStrategy({
      type: 'success',
      value: fakeGoogleSuccess({
        googleId: 'g-new-1',
        email: 'new.google@example.com',
      }),
    });

    const res = await request(app).get(AUTH_PATH);

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      email: 'new.google@example.com',
      firstName: 'Google',
      lastName: 'User',
    });
    expect(res.body.user.userId).toBeTruthy();

    const stored = await UserModel.findOne({ username: 'new.google@example.com' });
    expect(stored).toBeTruthy();
    expect(stored!.verified).toBe(true);
    expect(stored!.googleId).toBe('g-new-1');
    expect(stored!.googleRefreshToken).toBe('google-refresh-token');

    const jwtCookie = jwtCookieFromResponse(res);
    const taskRes = await authenticatedRequest(app, jwtCookie)
      .post('/api/sync/task')
      .send({
        changeableObjectDto: {
          id: 'task-from-google',
          type: ETaskType.Basic,
          title: 'Created after Google auth',
          status: ETaskStatus.Todo,
        },
      });

    expect(taskRes.status).toBe(201);
    expect(taskRes.body.userId).toBe(res.body.user.userId);
  });

  it('logs in an existing Google user and refreshes tokens', async () => {
    installFakeGoogleStrategy({
      type: 'success',
      value: fakeGoogleSuccess({
        googleId: 'g-existing',
        email: 'existing.google@example.com',
        refreshToken: 'first-refresh',
      }),
    });
    await request(app).get(AUTH_PATH);

    installFakeGoogleStrategy({
      type: 'success',
      value: fakeGoogleSuccess({
        googleId: 'g-existing',
        email: 'existing.google@example.com',
        accessToken: 'second-access',
        refreshToken: 'second-refresh',
      }),
    });
    const res = await request(app).get(AUTH_PATH);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('existing.google@example.com');

    const stored = await UserModel.findOne({ googleId: 'g-existing' });
    expect(stored!.googleAccessToken).toBe('second-access');
    expect(stored!.googleRefreshToken).toBe('second-refresh');
    expect(await UserModel.countDocuments({ googleId: 'g-existing' })).toBe(1);
  });

  it('rejects a new Google user when refresh token is missing', async () => {
    installFakeGoogleStrategy({
      type: 'success',
      value: fakeGoogleSuccess({
        googleId: 'g-no-refresh',
        email: 'norefresh@example.com',
        refreshToken: '',
      }),
    });

    const res = await request(app).get(AUTH_PATH);

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('GOOGLE_OAUTH_REFRESH_TOKEN_NOT_RECEIVED');
    expect(await UserModel.countDocuments({ username: 'norefresh@example.com' })).toBe(0);
  });

  it('rejects Google sign-in when a verified local account already owns the email', async () => {
    await seedTestUser({ email: 'taken@example.com' });
    await UserModel.updateOne({ username: 'taken@example.com' }, { $set: { verified: true } });

    installFakeGoogleStrategy({
      type: 'success',
      value: fakeGoogleSuccess({
        googleId: 'g-taken',
        email: 'taken@example.com',
      }),
    });

    const res = await request(app).get(AUTH_PATH);

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('GOOGLE_OAUTH_EMAIL_ALREADY_IN_USE');
  });

  it('returns authorization failed when the Google strategy errors', async () => {
    installFakeGoogleStrategy({
      type: 'error',
      error: new Error('invalid grant'),
    });

    const res = await request(app).get(AUTH_PATH);

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('GOOGLE_OAUTH_AUTHORIZATION_FAILED');
  });
});
