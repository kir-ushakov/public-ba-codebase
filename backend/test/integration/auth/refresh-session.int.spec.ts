import jwt from 'jsonwebtoken';
import { Application } from 'express';
import request from 'supertest';
import { ERefreshSessionUseCaseError, ETaskStatus, ETaskType } from '@brainassistant/contracts';
import UserModel from '../../../src/shared/infra/database/mongodb/user.model.js';
import RefreshSessionModel from '../../../src/shared/infra/database/mongodb/refresh-session.model.js';
import { requiredEnv } from '../../../src/config/index.js';
import { LoginService } from '../../../src/modules/auth/services/login.service.js';
import { hashRefreshToken } from '../../../src/modules/auth/services/refresh-token.function.js';
import {
  authenticatedRequest,
  jwtCookieFromResponse,
  refreshCookieFromResponse,
  seedTestUser,
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

    const headers = setCookieHeaders(res);
    expect(
      headers.some(cookie => cookie.startsWith('jwt=') && cookie.includes('SameSite=Lax')),
    ).toBe(true);
    expect(
      headers.some(
        cookie =>
          cookie.startsWith('refresh=') &&
          cookie.includes('SameSite=Lax') &&
          cookie.includes('Path=/api/auth'),
      ),
    ).toBe(true);

    const after = await RefreshSessionModel.find({ userId });
    expect(after).toHaveLength(2);
    const active = after.find(row => !row.consumedAt);
    const spent = after.find(row => row.consumedAt);
    expect(active?.tokenHash).toBe(hashRefreshToken(nextRefresh.slice('refresh='.length)));
    expect(spent?.tokenHash).toBe(before[0]?.tokenHash);
    expect(active?.familyId).toBe(spent?.familyId);

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

  it('rejects an immediate replay without revoking the rotated session', async () => {
    const { refreshCookie, userId } = await login();

    const first = await request(app).post('/api/auth/refresh').set('Cookie', refreshCookie);
    expect(first.status).toBe(200);
    const current = refreshCookieFromResponse(first);

    const reused = await request(app).post('/api/auth/refresh').set('Cookie', refreshCookie);
    expect(reused.status).toBe(401);
    expect(reused.body.name).toBe(ERefreshSessionUseCaseError.Invalid);
    expect(reused.body.message).toBe('Refresh session is invalid');

    const stillThere = await RefreshSessionModel.find({ userId });
    expect(stillThere).toHaveLength(2);
    const active = stillThere.find(row => !row.consumedAt);
    expect(active?.tokenHash).toBe(hashRefreshToken(current.slice('refresh='.length)));

    const taskRes = await authenticatedRequest(app, jwtCookieFromResponse(first)).get(
      '/api/sync/changes',
    );
    expect(taskRes.status).toBe(200);
  });

  it('revokes the rotated session when a spent refresh token is reused', async () => {
    const { refreshCookie, userId } = await login();
    const rawToken = refreshCookie.slice('refresh='.length);

    const first = await request(app).post('/api/auth/refresh').set('Cookie', refreshCookie);
    expect(first.status).toBe(200);
    const nextJwt = jwtCookieFromResponse(first);

    await RefreshSessionModel.updateOne(
      { tokenHash: hashRefreshToken(rawToken) },
      { $set: { consumedAt: new Date(Date.now() - LoginService.REFRESH_REUSE_GRACE_MS - 1_000) } },
    );

    const reused = await request(app).post('/api/auth/refresh').set('Cookie', refreshCookie);
    expect(reused.status).toBe(401);
    expect(reused.body.name).toBe(ERefreshSessionUseCaseError.Invalid);
    expect(reused.body.message).toBe('Refresh session is invalid');
    expect(await RefreshSessionModel.countDocuments({ userId })).toBe(0);

    const taskRes = await authenticatedRequest(app, nextJwt).get('/api/sync/changes');
    expect(taskRes.status).toBe(401);
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
    expect(list.some(cookie => cookie.startsWith('jwt=;') && /Path=\/(;|$)/.test(cookie))).toBe(
      true,
    );
    expect(
      list.some(cookie => cookie.startsWith('refresh=;') && cookie.includes('Path=/api/auth')),
    ).toBe(true);
    expect(await RefreshSessionModel.countDocuments({ userId })).toBe(0);

    const taskRes = await authenticatedRequest(app, jwtCookie).get('/api/sync/changes');
    expect(taskRes.status).toBe(401);
  });

  it('logout of one login leaves a second device signed in', async () => {
    const first = await login();
    const secondRes = await request(app).post('/api/auth/login').send({
      username: signupBody.email,
      password: signupBody.password,
    });
    expect(secondRes.status).toBe(200);
    const secondJwt = jwtCookieFromResponse(secondRes);

    const res = await request(app)
      .delete('/api/auth/logout')
      .set('Cookie', `${first.jwtCookie}; ${first.refreshCookie}`);
    expect(res.status).toBe(200);

    const firstAccess = await authenticatedRequest(app, first.jwtCookie).get('/api/sync/changes');
    expect(firstAccess.status).toBe(401);
    const secondAccess = await authenticatedRequest(app, secondJwt).get('/api/sync/changes');
    expect(secondAccess.status).toBe(200);
  });

  it('does not extend the access cookie when an authenticated request succeeds', async () => {
    const { jwtCookie } = await seedTestUser({ email: 'slide.user@example.com' });
    const token = jwtCookie.slice('jwt='.length);
    const decoded = jwt.decode(token);
    if (!decoded || typeof decoded === 'string') {
      throw new Error('jwt payload missing');
    }
    expect(decoded.exp).toBe((decoded.iat ?? 0) + LoginService.JWT_TTL_SECONDS);

    const res = await authenticatedRequest(app, jwtCookie).get('/api/sync/changes');
    expect(res.status).toBe(200);
    expect(setCookieHeaders(res).some(cookie => cookie.startsWith('jwt='))).toBe(false);
  });

  it('rejects an access token that is past its one-hour expiry', async () => {
    const { userId } = await seedTestUser({ email: 'expired.jwt@example.com' });
    const session = await RefreshSessionModel.findOne({ userId }).exec();
    if (!session) {
      throw new Error('session missing');
    }

    const token = jwt.sign(
      {
        user: {
          firstName: 'Test',
          lastName: 'User',
          email: 'expired.jwt@example.com',
          userId,
        },
        sid: session._id.toString(),
        exp: Math.floor(Date.now() / 1000) - 60,
      },
      requiredEnv('JWT_SECRET'),
    );

    const res = await authenticatedRequest(app, `jwt=${token}`).get('/api/sync/changes');
    expect(res.status).toBe(401);
    expect(res.body.name).toBe('USER_NOT_AUTHENTICATED');
  });

  it('rejects an access token that is not bound to a session', async () => {
    const { userId } = await seedTestUser({ email: 'nosid.jwt@example.com' });
    const token = jwt.sign(
      {
        user: {
          firstName: 'Test',
          lastName: 'User',
          email: 'nosid.jwt@example.com',
          userId,
        },
      },
      requiredEnv('JWT_SECRET'),
      { expiresIn: LoginService.JWT_TTL_SECONDS },
    );

    const res = await authenticatedRequest(app, `jwt=${token}`).get('/api/sync/changes');
    expect(res.status).toBe(401);
    expect(res.body.name).toBe('USER_NOT_AUTHENTICATED');
  });

  it('rejects the access token that belonged to a refresh token after it was rotated', async () => {
    const { jwtCookie, refreshCookie } = await login();

    const refreshed = await request(app).post('/api/auth/refresh').set('Cookie', refreshCookie);
    expect(refreshed.status).toBe(200);

    const oldAccess = await authenticatedRequest(app, jwtCookie).get('/api/sync/changes');
    expect(oldAccess.status).toBe(401);
    const nextAccess = await authenticatedRequest(app, jwtCookieFromResponse(refreshed)).get(
      '/api/sync/changes',
    );
    expect(nextAccess.status).toBe(200);
  });

  it('refreshes a session row written before families existed', async () => {
    const { refreshCookie, userId } = await login();
    await RefreshSessionModel.updateOne({ userId }, { $unset: { familyId: '' } });

    const res = await request(app).post('/api/auth/refresh').set('Cookie', refreshCookie);

    expect(res.status).toBe(200);
    const rows = await RefreshSessionModel.find({ userId });
    expect(rows).toHaveLength(2);
    const spent = rows.find(row => row.consumedAt);
    const active = rows.find(row => !row.consumedAt);
    expect(spent?.familyId).toBe(spent?._id.toString());
    expect(active?.familyId).toBe(spent?.familyId);

    const taskRes = await authenticatedRequest(app, jwtCookieFromResponse(res)).get(
      '/api/sync/changes',
    );
    expect(taskRes.status).toBe(200);
  });
});

function setCookieHeaders(res: { headers: Record<string, unknown> }): string[] {
  const raw = res.headers['set-cookie'];
  return Array.isArray(raw)
    ? raw.filter((cookie): cookie is string => typeof cookie === 'string')
    : [];
}
