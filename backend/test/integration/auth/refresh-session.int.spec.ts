import { Application } from 'express';
import request from 'supertest';
import { ERefreshSessionUseCaseError, ETaskStatus, ETaskType } from '@brainassistant/contracts';
import UserModel from '../../../src/shared/infra/database/mongodb/user.model.js';
import RefreshSessionModel from '../../../src/shared/infra/database/mongodb/refresh-session.model.js';
import { hashRefreshToken } from '../../../src/modules/auth/services/refresh-token.function.js';
import {
  authenticatedRequest,
  jwtCookieFromResponse,
  refreshCookieFromResponse,
} from '../_setup/auth.helper.js';
import { buildTestApp } from '../_setup/build-test-app.js';
import { clearDatabase, startInMemoryMongo, stopInMemoryMongo } from '../_setup/mongo-memory.js';

describe('Integration: RefreshSession (Controller -> UseCase -> Repo -> MongoDB)', () => {
  let app: Application;

  const signupBody = {
    email: 'refresh.user@example.com',
    firstName: 'Refresh',
    lastName: 'User',
    password: 'password123',
  };

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

  async function login(): Promise<{ jwtCookie: string; refreshCookie: string; userId: string }> {
    await request(app).post('/api/auth/signup').send(signupBody);
    await UserModel.updateOne({ username: signupBody.email }, { $set: { verified: true } });
    const res = await request(app).post('/api/auth/login').send({
      username: signupBody.email,
      password: signupBody.password,
    });
    expect(res.status).toBe(200);
    return {
      jwtCookie: jwtCookieFromResponse(res),
      refreshCookie: refreshCookieFromResponse(res),
      userId: res.body.user.userId as string,
    };
  }

  it('rotates the refresh cookie and the stored hash, and the new jwt can call a protected route', async () => {
    const { refreshCookie, userId } = await login();
    const rawToken = refreshCookie.slice('refresh='.length);
    const before = await RefreshSessionModel.find({ userId });
    expect(before).toHaveLength(1);
    expect(before[0]?.tokenHash).toBe(hashRefreshToken(rawToken));

    const res = await request(app).post('/api/auth/refresh').set('Cookie', refreshCookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ refreshed: true });
    const nextRefresh = refreshCookieFromResponse(res);
    const nextJwt = jwtCookieFromResponse(res);
    expect(nextRefresh).not.toBe(refreshCookie);

    const after = await RefreshSessionModel.find({ userId });
    expect(after).toHaveLength(1);
    expect(after[0]?.tokenHash).toBe(hashRefreshToken(nextRefresh.slice('refresh='.length)));
    expect(after[0]?.tokenHash).not.toBe(before[0]?.tokenHash);

    const taskRes = await authenticatedRequest(app, nextJwt)
      .post('/api/sync/task')
      .send({
        changeableObjectDto: {
          id: 'task-after-refresh',
          type: ETaskType.Basic,
          title: 'Created after refresh',
          status: ETaskStatus.Todo,
        },
      });
    expect(taskRes.status).toBe(201);
    expect(taskRes.body.userId).toBe(userId);
  });

  it('rejects a refresh token that was already rotated', async () => {
    const { refreshCookie, userId } = await login();

    const first = await request(app).post('/api/auth/refresh').set('Cookie', refreshCookie);
    expect(first.status).toBe(200);
    const current = refreshCookieFromResponse(first);

    const reused = await request(app).post('/api/auth/refresh').set('Cookie', refreshCookie);
    expect(reused.status).toBe(401);
    expect(reused.body.name).toBe(ERefreshSessionUseCaseError.Invalid);
    expect(reused.body.message).toBe('Refresh session is invalid');

    const stillThere = await RefreshSessionModel.find({ userId });
    expect(stillThere).toHaveLength(1);
    expect(stillThere[0]?.tokenHash).toBe(hashRefreshToken(current.slice('refresh='.length)));
  });

  it('rejects an expired refresh token', async () => {
    const { refreshCookie, userId } = await login();
    await RefreshSessionModel.updateOne({ userId }, { $set: { expiresAt: new Date(0) } });

    const res = await request(app).post('/api/auth/refresh').set('Cookie', refreshCookie);

    expect(res.status).toBe(401);
    expect(res.body.name).toBe(ERefreshSessionUseCaseError.Invalid);
    expect(res.body.message).toBe('Refresh session is invalid');
    expect(await RefreshSessionModel.countDocuments({ userId })).toBe(0);
  });

  it('rejects a request with no refresh cookie', async () => {
    const res = await request(app).post('/api/auth/refresh');

    expect(res.status).toBe(401);
    expect(res.body.name).toBe(ERefreshSessionUseCaseError.Invalid);
    expect(res.body.message).toBe('Refresh session is invalid');
  });

  it('logout deletes the refresh session and clears both cookies', async () => {
    const { jwtCookie, refreshCookie, userId } = await login();

    const res = await request(app)
      .delete('/api/auth/logout')
      .set('Cookie', `${jwtCookie}; ${refreshCookie}`);

    expect(res.status).toBe(200);
    const cleared = res.headers['set-cookie'];
    const list = Array.isArray(cleared) ? cleared : [];
    expect(list.some(cookie => cookie.startsWith('jwt=;'))).toBe(true);
    expect(list.some(cookie => cookie.startsWith('refresh=;'))).toBe(true);
    expect(await RefreshSessionModel.countDocuments({ userId })).toBe(0);
  });
});
