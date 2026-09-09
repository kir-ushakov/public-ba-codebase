import { Application } from 'express';
import request from 'supertest';
import {
  EChangeAction,
  EChangedEntity,
  ETaskStatus,
  ETaskType,
  GetChangesContract,
} from '@brainassistant/contracts';
import { EGetChangesUseCaseError } from '../../../src/modules/sync/usecases/get-changes/get-changes.errors.js';
import { models } from '../../../src/shared/infra/database/mongodb/index.js';
import { ServiceErrorLevel } from '../../../src/shared/core/service-error-level.enum.js';
import { ETaskError } from '../../../src/shared/domain/models/task.js';
import { ETaskRepoLoadError } from '../../../src/shared/repo/task-repo.service.js';
import { authenticatedRequest, seedTestUser } from '../_setup/auth.helper.js';
import { buildTestApp } from '../_setup/build-test-app.js';
import { clearDatabase, startInMemoryMongo, stopInMemoryMongo } from '../_setup/mongo-memory.js';
import { allocateClientId, createTaskViaApi } from '../_setup/sync.helper.js';

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
    const res = await request(app).get('/api/sync/changes').query({ clientId: 'client-unauth' });

    expect(res.status).toBe(401);
  });

  it('returns 404 for an unknown clientId', async () => {
    const { jwtCookie } = await seedTestUser();

    const res = await authenticatedRequest(app, jwtCookie)
      .get('/api/sync/changes')
      .query({ clientId: 'aaaaaaaaaaaaaaaaaaaaaaaa' });

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      name: EGetChangesUseCaseError.ClientNotFound,
    });
    expect(res.body).toHaveProperty('message');
  });

  it('delivers the same new task to two clientIds, then nothing on a second pull', async () => {
    const { jwtCookie } = await seedTestUser();
    const clientA = await allocateClientId(app, jwtCookie);
    const clientB = await allocateClientId(app, jwtCookie);
    const created = await createTaskViaApi(app, jwtCookie, {
      id: 'task-changes-1',
      title: 'Shared across two clients',
    });

    const firstA = await fetchChanges(app, jwtCookie, clientA);
    expect(firstA.status).toBe(200);
    expectTaskUpdated(firstA.body, created.id, created.title);

    const firstB = await fetchChanges(app, jwtCookie, clientB);
    expect(firstB.status).toBe(200);
    expectTaskUpdated(firstB.body, created.id, created.title);

    const secondA = await fetchChanges(app, jwtCookie, clientA);
    expect(secondA.status).toBe(200);
    expect(secondA.body.changes).toEqual([]);
  });

  it('surfaces a delete to a client that already pulled the task', async () => {
    const { jwtCookie } = await seedTestUser();
    const clientA = await allocateClientId(app, jwtCookie);
    const created = await createTaskViaApi(app, jwtCookie, {
      id: 'task-changes-del',
      title: 'Will be deleted after sync',
    });

    const firstPull = await fetchChanges(app, jwtCookie, clientA);
    expect(firstPull.status).toBe(200);
    expectTaskUpdated(firstPull.body, created.id, created.title);

    const del = await authenticatedRequest(app, jwtCookie).delete(`/api/sync/task/${created.id}`);
    expect(del.status).toBe(200);

    const secondPull = await fetchChanges(app, jwtCookie, clientA);
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
    const clientId = await allocateClientId(app, jwtCookie);
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
      const res = await fetchChanges(app, jwtCookie, clientId);
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
});

function fetchChanges(app: Application, jwtCookie: string, clientId: string): request.Test {
  return authenticatedRequest(app, jwtCookie).get('/api/sync/changes').query({ clientId });
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
