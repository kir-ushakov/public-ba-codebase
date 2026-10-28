import { Application } from 'express';
import { models } from '../../../src/shared/infra/database/mongodb/index.js';
import { SyncRevisionService } from '../../../src/shared/repo/sync-revision.service.js';
import {
  runWithSyncNotificationScope,
  setSyncNotificationPublisher,
  useInProcessSyncNotifications,
  type SyncChangedEvent,
} from '../../../src/shared/infra/sync-signal/sync-notification.js';
import { authenticatedRequest, seedTestUser } from '../_setup/auth.helper.js';
import { buildTestApp } from '../_setup/build-test-app.js';
import { clearDatabase, startInMemoryMongo, stopInMemoryMongo } from '../_setup/mongo-memory.js';
import { createTagViaApi, createTaskViaApi } from '../_setup/sync.helper.js';

describe('Integration: sync revision signal', () => {
  let app: Application;
  let published: SyncChangedEvent[];

  beforeAll(async () => {
    await startInMemoryMongo();
    app = buildTestApp().app;
  }, 120_000);

  afterAll(async () => {
    useInProcessSyncNotifications();
    await stopInMemoryMongo();
  });

  beforeEach(async () => {
    await clearDatabase();
    published = [];
    setSyncNotificationPublisher({
      async publish(event: SyncChangedEvent): Promise<void> {
        published.push(event);
      },
    });
  });

  it('publishes the committed revision after a task is created', async () => {
    const { userId, jwtCookie } = await seedTestUser();

    await createTaskViaApi(app, jwtCookie, { id: 'task-signal' });
    await waitForCount(published, 1);

    const persisted = await models.TaskModel.findById('task-signal').lean();
    expect(persisted?.syncRevision).toEqual(expect.any(Number));
    expect(published).toEqual([{ userId, revision: persisted?.syncRevision }]);
  });

  it('publishes one event with the highest revision when one request stamps several documents', async () => {
    const { userId, jwtCookie } = await seedTestUser();
    await createTagViaApi(app, jwtCookie, { id: 'tag-signal' });
    await createTaskViaApi(app, jwtCookie, { id: 'task-signal', tagIds: ['tag-signal'] });
    await waitForCount(published, 2);
    published.length = 0;

    const res = await authenticatedRequest(app, jwtCookie).delete('/api/sync/tag/tag-signal');
    expect(res.status).toBe(200);
    await waitForCount(published, 1);

    const counter = await models.SyncCounterModel.findById(userId).lean();
    expect(published).toEqual([{ userId, revision: counter?.value }]);
  });

  it('rolls the counter back when the revision is not stored on the document', async () => {
    const { userId, jwtCookie } = await seedTestUser();
    await createTaskViaApi(app, jwtCookie, { id: 'task-signal' });
    await waitForCount(published, 1);
    published.length = 0;
    const before = await models.SyncCounterModel.findById(userId).lean();

    const originalUpdate = models.TaskModel.updateOne.bind(models.TaskModel);
    models.TaskModel.updateOne = (() =>
      Promise.reject(
        new Error('stamp update failed'),
      )) as unknown as typeof models.TaskModel.updateOne;
    try {
      const revisions = new SyncRevisionService(models);
      await expect(
        runWithSyncNotificationScope(async () => {
          await revisions.stampTask(userId, 'task-signal');
        }),
      ).rejects.toThrow('stamp update failed');
    } finally {
      models.TaskModel.updateOne = originalUpdate;
    }

    expect(published).toEqual([]);
    const after = await models.SyncCounterModel.findById(userId).lean();
    expect(after?.value).toBe(before?.value);
    const persisted = await models.TaskModel.findById('task-signal').lean();
    expect(persisted?.syncRevision).toBe(before?.value);
  });

  it('does not publish or advance the counter when the document is missing', async () => {
    const { userId } = await seedTestUser();
    const revisions = new SyncRevisionService(models);

    await runWithSyncNotificationScope(async () => {
      await revisions.stampTask(userId, 'missing-task');
    });

    expect(published).toEqual([]);
    const counter = await models.SyncCounterModel.findById(userId).lean();
    expect(counter).toBeNull();
  });

  it('publishes a committed stamp when the request fails afterwards', async () => {
    const { userId, jwtCookie } = await seedTestUser();
    await createTaskViaApi(app, jwtCookie, { id: 'task-signal' });
    await waitForCount(published, 1);
    published.length = 0;

    const revisions = new SyncRevisionService(models);
    await expect(
      runWithSyncNotificationScope(async () => {
        await revisions.stampTask(userId, 'task-signal');
        throw new Error('later');
      }),
    ).rejects.toThrow('later');

    await waitForCount(published, 1);
    const persisted = await models.TaskModel.findById('task-signal').lean();
    expect(published).toEqual([{ userId, revision: persisted?.syncRevision }]);
    const counter = await models.SyncCounterModel.findById(userId).lean();
    expect(counter?.value).toBe(persisted?.syncRevision);
  });
});

async function waitForCount(events: SyncChangedEvent[], count: number): Promise<void> {
  for (let attempt = 0; attempt < 30; attempt++) {
    if (events.length >= count) {
      return;
    }
    await new Promise(resolve => setImmediate(resolve));
  }
  throw new Error(`expected ${count} sync notifications, received ${events.length}`);
}
