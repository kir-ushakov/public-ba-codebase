import { Application } from 'express';
import request from 'supertest';
import { EActionType } from '../../../src/shared/domain/models/action-type.enum.js';
import { models } from '../../../src/shared/infra/database/mongodb/index.js';
import { authenticatedRequest, seedTestUser } from '../_setup/auth.helper.js';
import { buildTestApp } from '../_setup/build-test-app.js';
import { clearDatabase, startInMemoryMongo, stopInMemoryMongo } from '../_setup/mongo-memory.js';
import { createTagViaApi, createTaskViaApi } from '../_setup/sync.helper.js';

describe('Integration: DeleteTag (Controller -> UseCase -> Repo -> MongoDB)', () => {
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
    const res = await request(app).delete('/api/sync/tag/tag-unauth');

    expect(res.status).toBe(401);
  });

  it('removes the tag, records TagDeleted, and pulls the id off the user tasks', async () => {
    const { userId, jwtCookie } = await seedTestUser();
    const tag = await createTagViaApi(app, jwtCookie, { id: 'tag-delete-1', name: 'Work' });
    const task = await createTaskViaApi(app, jwtCookie, {
      id: 'task-with-tag',
      title: 'Tagged task',
      tagIds: [tag.id],
    });

    const res = await authenticatedRequest(app, jwtCookie).delete(`/api/sync/tag/${tag.id}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({});
    expect(await models.TagModel.findById(tag.id).lean()).toBeNull();

    const persistedTask = await models.TaskModel.findById(task.id).lean();
    expect(persistedTask?.tagIds ?? []).not.toContain(tag.id);

    const action = await models.ActionModel.findOne({
      userId,
      entityId: tag.id,
      type: EActionType.TagDeleted,
    }).lean();
    expect(action).toMatchObject({
      userId,
      entityId: tag.id,
      type: EActionType.TagDeleted,
    });
  });

  it('deleting a missing tag returns 200 and writes no action', async () => {
    const { jwtCookie } = await seedTestUser();

    const res = await authenticatedRequest(app, jwtCookie).delete('/api/sync/tag/tag-already-gone');

    expect(res.status).toBe(200);
    expect(await models.ActionModel.countDocuments()).toBe(0);
  });
});
