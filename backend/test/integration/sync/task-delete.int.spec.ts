import { Application } from 'express';
import request from 'supertest';
import { EActionType } from '../../../src/shared/infra/database/mongodb/action.model.js';
import { models } from '../../../src/shared/infra/database/mongodb/index.js';
import { authenticatedRequest, seedTestUser } from '../_setup/auth.helper.js';
import { buildTestApp } from '../_setup/build-test-app.js';
import { clearDatabase, startInMemoryMongo, stopInMemoryMongo } from '../_setup/mongo-memory.js';
import { createTaskViaApi } from '../_setup/sync.helper.js';

describe('Integration: DeleteTask (Controller -> UseCase -> Repo -> MongoDB)', () => {
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
    const res = await request(app).delete('/api/sync/task/task-unauth');

    expect(res.status).toBe(401);
  });

  it('happy path: deletes the task and records a TaskDeleted action', async () => {
    const { userId, jwtCookie } = await seedTestUser();
    const created = await createTaskViaApi(app, jwtCookie, {
      id: 'task-delete-1',
      title: 'Task to delete now',
    });

    const res = await authenticatedRequest(app, jwtCookie).delete(`/api/sync/task/${created.id}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({});
    expect(await models.TaskModel.findById(created.id).lean()).toBeNull();

    const action = await models.ActionModel.findOne({
      userId,
      entityId: created.id,
      type: EActionType.TaskDeleted,
    }).lean();
    expect(action).toMatchObject({
      userId,
      entityId: created.id,
      type: EActionType.TaskDeleted,
    });
    expect(action.occurredAt).toBeInstanceOf(Date);
  });

  it('is idempotent: deleting a missing task still returns 200 and writes no action', async () => {
    const { jwtCookie } = await seedTestUser();

    const res = await authenticatedRequest(app, jwtCookie).delete('/api/sync/task/task-already-gone');

    expect(res.status).toBe(200);
    expect(await models.ActionModel.countDocuments()).toBe(0);
  });
});
