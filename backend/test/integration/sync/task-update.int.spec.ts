import { Application } from 'express';
import request from 'supertest';
import { models } from '../../../src/shared/infra/database/mongodb/index.js';
import { authenticatedRequest, seedTestUser } from '../_setup/auth.helper.js';
import { buildTestApp } from '../_setup/build-test-app.js';
import { clearDatabase, startInMemoryMongo, stopInMemoryMongo } from '../_setup/mongo-memory.js';
import { createTaskViaApi } from '../_setup/sync.helper.js';

describe('Integration: UpdateTask (Controller -> UseCase -> Repo -> MongoDB)', () => {
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
      .patch('/api/sync/task')
      .send({
        changeableObjectDto: {
          id: 'task-unauth',
          type: 'TASK',
          title: 'Should not update',
          status: 'OPEN',
        },
      });

    expect(res.status).toBe(401);
  });

  it('happy path: updates title and preserves createdAt', async () => {
    const { jwtCookie } = await seedTestUser();
    const created = await createTaskViaApi(app, jwtCookie, {
      id: 'task-update-1',
      title: 'Original task title',
    });

    const res = await authenticatedRequest(app, jwtCookie)
      .patch('/api/sync/task')
      .send({
        changeableObjectDto: {
          ...created,
          title: 'Updated task title',
        },
      })
      .set('Accept', 'application/json');

    expect(res.status).toBe(200);

    const persisted = await models.TaskModel.findById(created.id).lean();
    expect(persisted).toMatchObject({
      title: 'Updated task title',
      type: created.type,
      status: created.status,
    });
    expect(new Date(persisted.createdAt).toISOString()).toBe(created.createdAt);
  });

  it('returns 404 when the task does not exist', async () => {
    const { jwtCookie } = await seedTestUser();

    const res = await authenticatedRequest(app, jwtCookie)
      .patch('/api/sync/task')
      .send({
        changeableObjectDto: {
          id: 'task-missing',
          type: 'TASK',
          title: 'Missing task title',
          status: 'OPEN',
        },
      })
      .set('Accept', 'application/json');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('name');
    expect(res.body).toHaveProperty('message');
  });

  it('invalid title -> 400 and the persisted title is unchanged', async () => {
    const { jwtCookie } = await seedTestUser();
    const created = await createTaskViaApi(app, jwtCookie, {
      id: 'task-update-invalid',
      title: 'Valid task title',
    });

    const res = await authenticatedRequest(app, jwtCookie)
      .patch('/api/sync/task')
      .send({
        changeableObjectDto: {
          ...created,
          title: '',
        },
      })
      .set('Accept', 'application/json');

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('name');
    expect(res.body).toHaveProperty('message');

    const persisted = await models.TaskModel.findById(created.id).lean();
    expect(persisted.title).toBe('Valid task title');
  });
});
