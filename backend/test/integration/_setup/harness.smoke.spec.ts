import request from 'supertest';
import { Application } from 'express';
import { ETaskStatus, ETaskType } from '@brainassistant/contracts';
import { startInMemoryMongo, stopInMemoryMongo, clearDatabase } from './mongo-memory.js';
import { buildTestApp } from './build-test-app.js';
import { authenticatedRequest, seedTestUser } from './auth.helper.js';

describe('Integration: test harness (createApp + JWT)', () => {
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

  it('returns 401 without auth cookie', async () => {
    const res = await request(app)
      .post('/api/sync/task')
      .send({
        changeableObjectDto: {
          id: 'task-unauth',
          type: ETaskType.Basic,
          title: 'Should not be created',
          status: ETaskStatus.Todo,
        },
      });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      name: 'USER_NOT_AUTHENTICATED',
      message: 'User not authenticated',
    });
  });

  it('returns 201 with a valid JWT cookie', async () => {
    const { userId, jwtCookie } = await seedTestUser();

    const res = await authenticatedRequest(app, jwtCookie)
      .post('/api/sync/task')
      .send({
        changeableObjectDto: {
          id: 'task-smoke-1',
          type: ETaskType.Basic,
          title: 'Harness smoke task',
          status: ETaskStatus.Todo,
        },
      })
      .set('Accept', 'application/json');

    expect(res.status).toBe(201);
    expect(res.body.id).toBe('task-smoke-1');
    expect(res.body.title).toBe('Harness smoke task');
    expect(res.body.userId).toBe(userId);
  });
});
