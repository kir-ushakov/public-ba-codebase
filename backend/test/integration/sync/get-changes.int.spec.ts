import { Application } from 'express';
import request from 'supertest';
import {
  EChangeAction,
  EChangedEntity,
  ETaskStatus,
  ETaskType,
  GetChangesContract,
} from '@brainassistant/contracts';
import { models } from '../../../src/shared/infra/database/mongodb/index.js';
import { ServiceErrorLevel } from '../../../src/shared/core/service-error-level.enum.js';
import { ETaskError } from '../../../src/shared/domain/models/task.js';
import { ETaskRepoLoadError } from '../../../src/shared/repo/task-repo.service.js';
import { authenticatedRequest, seedTestUser } from '../_setup/auth.helper.js';
import { buildTestApp } from '../_setup/build-test-app.js';
import { clearDatabase, startInMemoryMongo, stopInMemoryMongo } from '../_setup/mongo-memory.js';
import { createTagViaApi, createTaskViaApi } from '../_setup/sync.helper.js';

describe('Integration: GetChanges (Controller -> UseCase -> Repo -> MongoDB)', () => {
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
    const res = await request(app).get('/api/sync/changes').query({ afterRevision: '0' });

    expect(res.status).toBe(401);
  });

  it('delivers the same new task twice from revision 0, then nothing after that revision', async () => {
    const { jwtCookie } = await seedTestUser();
    const created = await createTaskViaApi(app, jwtCookie, {
      id: 'task-changes-1',
      title: 'Shared across two clients',
    });

    const firstA = await fetchChanges(app, jwtCookie);
    expect(firstA.status).toBe(200);
    expectTaskUpdated(firstA.body, created.id, created.title);

    const firstB = await fetchChanges(app, jwtCookie);
    expect(firstB.status).toBe(200);
    expectTaskUpdated(firstB.body, created.id, created.title);

    const secondA = await fetchChanges(app, jwtCookie, firstA.body.syncRevision);
    expect(secondA.status).toBe(200);
    expect(secondA.body.changes).toEqual([]);
  });

  it('surfaces a delete after the revision that included the task', async () => {
    const { jwtCookie } = await seedTestUser();
    const created = await createTaskViaApi(app, jwtCookie, {
      id: 'task-changes-del',
      title: 'Will be deleted after sync',
    });

    const firstPull = await fetchChanges(app, jwtCookie);
    expect(firstPull.status).toBe(200);
    expectTaskUpdated(firstPull.body, created.id, created.title);

    const del = await authenticatedRequest(app, jwtCookie).delete(`/api/sync/task/${created.id}`);
    expect(del.status).toBe(200);

    const secondPull = await fetchChanges(app, jwtCookie, firstPull.body.syncRevision);
    expect(secondPull.status).toBe(200);
    expect(secondPull.body.changes).toEqual([
      expect.objectContaining({
        entity: EChangedEntity.Task,
        action: EChangeAction.Deleted,
        object: expect.objectContaining({ id: created.id }),
      }),
    ]);
  });

  it('skips a persisted task that fails write-time validation instead of 500', async () => {
    const { userId, jwtCookie } = await seedTestUser();
    const validTask = await createTaskViaApi(app, jwtCookie, {
      id: 'task-valid-alongside-legacy',
      title: 'Still delivered with the legacy row',
    });

    await models.TaskModel.create({
      _id: 'legacy-empty-title',
      userId,
      type: ETaskType.Basic,
      title: '',
      status: ETaskStatus.Todo,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      modifiedAt: new Date('2024-01-02T00:00:00.000Z'),
    });

    const errorSpy = jest.spyOn(console, 'error').mockImplementation();

    try {
      const res = await fetchChanges(app, jwtCookie);
      expect(res.status).toBe(200);

      const body: GetChangesContract.Response = res.body;
      expect(body.changes).toEqual([
        expect.objectContaining({
          entity: EChangedEntity.Task,
          action: EChangeAction.Updated,
          object: expect.objectContaining({ id: validTask.id, title: validTask.title }),
        }),
      ]);

      expect(errorSpy).toHaveBeenCalledWith(
        `[SERVICE ERROR] ${ETaskRepoLoadError.PersistedTaskInvalid}: Persisted task failed write-time validation and was skipped`,
        expect.objectContaining({
          level: ServiceErrorLevel.Low,
          metadata: {
            taskId: 'legacy-empty-title',
            userId,
            domainCode: ETaskError.TitleMissed,
          },
        }),
      );
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('maps a task document without tagIds to an empty list', async () => {
    const { userId, jwtCookie } = await seedTestUser();

    await models.TaskModel.create({
      _id: 'legacy-no-tags',
      userId,
      type: ETaskType.Basic,
      title: 'Legacy task without tags',
      status: ETaskStatus.Todo,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      modifiedAt: new Date('2024-01-02T00:00:00.000Z'),
    });

    const res = await fetchChanges(app, jwtCookie);
    expect(res.status).toBe(200);
    expect(res.body.changes).toEqual([
      expect.objectContaining({
        entity: EChangedEntity.Task,
        action: EChangeAction.Updated,
        object: expect.objectContaining({ id: 'legacy-no-tags', tagIds: [] }),
      }),
    ]);
  });

  it('reads a stored tag that still has isCategory', async () => {
    const { userId, jwtCookie } = await seedTestUser();

    await models.TagModel.collection.insertOne({
      _id: 'legacy-category',
      userId,
      isCategory: true,
      name: 'Legacy',
      color: 'teal',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      modifiedAt: new Date('2024-01-02T00:00:00.000Z'),
    } as never);

    const res = await fetchChanges(app, jwtCookie);
    expect(res.status).toBe(200);
    expect(res.body.changes).toEqual([
      expect.objectContaining({
        entity: EChangedEntity.Tag,
        action: EChangeAction.Updated,
        object: expect.objectContaining({ id: 'legacy-category', name: 'Legacy' }),
      }),
    ]);
    expect(res.body.changes[0].object).not.toHaveProperty('isCategory');
  });

  it('delivers a created tag and then its deletion', async () => {
    const { jwtCookie } = await seedTestUser();
    const tag = await createTagViaApi(app, jwtCookie, { id: 'tag-changes-1', name: 'Work' });

    const firstPull = await fetchChanges(app, jwtCookie);
    expect(firstPull.status).toBe(200);
    expect(firstPull.body.changes).toEqual([
      expect.objectContaining({
        entity: EChangedEntity.Tag,
        action: EChangeAction.Updated,
        object: expect.objectContaining({ id: tag.id, name: tag.name }),
      }),
    ]);

    const del = await authenticatedRequest(app, jwtCookie).delete(`/api/sync/tag/${tag.id}`);
    expect(del.status).toBe(200);

    const secondPull = await fetchChanges(app, jwtCookie, firstPull.body.syncRevision);
    expect(secondPull.status).toBe(200);
    expect(secondPull.body.changes).toEqual([
      expect.objectContaining({
        entity: EChangedEntity.Tag,
        action: EChangeAction.Deleted,
        object: expect.objectContaining({ id: tag.id }),
      }),
    ]);
  });

  it('repeats a late upload with an old modifiedAt until the cursor moves past it', async () => {
    const { jwtCookie } = await seedTestUser();

    const baseline = await fetchChanges(app, jwtCookie);
    expect(baseline.status).toBe(200);
    expect(baseline.body.changes).toEqual([]);
    expect(baseline.body.syncRevision).toBe(0);

    const created = await authenticatedRequest(app, jwtCookie)
      .post('/api/sync/task')
      .send({
        changeableObjectDto: {
          id: 'task-offline-late',
          type: ETaskType.Basic,
          title: 'Created offline',
          status: ETaskStatus.Todo,
          createdAt: '2020-05-01T10:00:00.000Z',
          modifiedAt: '2020-05-01T10:00:00.000Z',
        },
      });
    expect(created.status).toBe(201);

    const first = await fetchChanges(app, jwtCookie);
    expect(first.status).toBe(200);
    expectTaskUpdated(first.body, 'task-offline-late', 'Created offline');

    const repeated = await fetchChanges(app, jwtCookie);
    expect(repeated.status).toBe(200);
    expectTaskUpdated(repeated.body, 'task-offline-late', 'Created offline');

    const afterCursor = await fetchChanges(app, jwtCookie, first.body.syncRevision);
    expect(afterCursor.status).toBe(200);
    expect(afterCursor.body.changes).toEqual([]);
  });

  it('delivers the latest snapshot when a task is edited before another device pulls', async () => {
    const { jwtCookie } = await seedTestUser();

    const created = await createTaskViaApi(app, jwtCookie, {
      id: 'task-edited-before-pull',
      title: 'First version',
    });
    const updated = await authenticatedRequest(app, jwtCookie)
      .patch('/api/sync/task')
      .send({
        changeableObjectDto: {
          ...created,
          title: 'Second version',
          modifiedAt: '2020-05-01T11:00:00.000Z',
        },
      });
    expect(updated.status).toBe(200);

    const pull = await fetchChanges(app, jwtCookie);
    expect(pull.status).toBe(200);
    expectTaskUpdated(pull.body, created.id, 'Second version');

    const afterCursor = await fetchChanges(app, jwtCookie, pull.body.syncRevision);
    expect(afterCursor.body.changes).toEqual([]);
  });

  it('delivers a task whose revision is above the cursor even when lower numbers are absent', async () => {
    const { userId, jwtCookie } = await seedTestUser();

    await models.TaskModel.create({
      _id: 'task-revision-five',
      userId,
      type: ETaskType.Basic,
      title: 'Stored only at five',
      status: ETaskStatus.Todo,
      createdAt: new Date('2020-05-01T10:00:00.000Z'),
      modifiedAt: new Date('2020-05-01T10:00:00.000Z'),
      syncRevision: 5,
    });

    const pull = await fetchChanges(app, jwtCookie);
    expect(pull.status).toBe(200);
    expectTaskUpdated(pull.body, 'task-revision-five', 'Stored only at five');
    expect(pull.body.syncRevision).toBe(5);
  });

  it('keeps later changes moving when a task is deleted before anyone pulls it', async () => {
    const { jwtCookie } = await seedTestUser();

    await createTaskViaApi(app, jwtCookie, {
      id: 'task-deleted-before-pull',
      title: 'Gone before pull',
    });
    const deleted = await authenticatedRequest(app, jwtCookie).delete(
      '/api/sync/task/task-deleted-before-pull',
    );
    expect(deleted.status).toBe(200);
    const later = await createTaskViaApi(app, jwtCookie, {
      id: 'task-after-delete',
      title: 'Still delivered',
    });

    const pull = await fetchChanges(app, jwtCookie);
    expect(pull.status).toBe(200);
    expect(pull.body.changes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          entity: EChangedEntity.Task,
          action: EChangeAction.Updated,
          object: expect.objectContaining({ id: later.id, title: later.title }),
        }),
      ]),
    );
  });
});

function fetchChanges(app: Application, jwtCookie: string, afterRevision = 0): request.Test {
  return authenticatedRequest(app, jwtCookie)
    .get('/api/sync/changes')
    .query({ afterRevision: String(afterRevision) });
}

function expectTaskUpdated(body: GetChangesContract.Response, taskId: string, title: string): void {
  expect(body.changes).toEqual([
    expect.objectContaining({
      entity: EChangedEntity.Task,
      action: EChangeAction.Updated,
      object: expect.objectContaining({ id: taskId, title }),
    }),
  ]);
}
