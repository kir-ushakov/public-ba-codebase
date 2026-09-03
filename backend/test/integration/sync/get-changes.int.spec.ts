import { Application } from 'express';
import request from 'supertest';
import { EChangeAction, EChangedEntity, GetChangesContract } from '@brainassistant/contracts';
import { GetChangesErrorCode } from '../../../src/modules/sync/usecases/get-changes/get-changes.errors.js';
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
      name: GetChangesErrorCode.ClientNotFound,
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
});

function fetchChanges(app: Application, jwtCookie: string, clientId: string) {
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
