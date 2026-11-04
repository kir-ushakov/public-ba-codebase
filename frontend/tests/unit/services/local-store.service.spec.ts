import { EChangeAction, EChangedEntity } from '@brainassistant/contracts';
import { TestBed } from '@angular/core/testing';
import { Change } from 'src/app/shared/models/change.model';
import { ETaskStatus, ETaskType, Task } from 'src/app/shared/models/task.model';
import {
  DATABASE_CONFIG,
  DatabaseService,
  LEGACY_NGXS_STATE_KEY,
  userDatabaseName,
} from 'src/app/shared/services/infrastructure/database.service';
import {
  commitReadWrite,
  LocalStore,
} from 'src/app/shared/services/infrastructure/local-store.service';
import { LocalSessionService } from 'src/app/shared/services/infrastructure/local-session.service';

const userA = 'user-a';
const userB = 'user-b';

function task(id: string, userId: string, title: string): Task {
  return {
    id,
    userId,
    type: ETaskType.Basic,
    title,
    status: ETaskStatus.Todo,
    createdAt: '2026-01-01T00:00:00.000Z',
    modifiedAt: '2026-01-01T00:00:00.000Z',
  };
}

function serverUpdate(next: Task): Change {
  return {
    entity: EChangedEntity.Task,
    action: EChangeAction.Updated,
    object: next,
  };
}

describe('LocalStore', () => {
  let database: DatabaseService;
  let store: LocalStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    database = TestBed.inject(DatabaseService);
    store = TestBed.inject(LocalStore);
  });

  afterEach(async () => {
    await database.close();
    await deleteDatabase(userDatabaseName(userA));
    await deleteDatabase(userDatabaseName(userB));
    await deleteDatabase(userDatabaseName('user-rollback'));
    localStorage.removeItem(LEGACY_NGXS_STATE_KEY);
  });

  it('keeps each account in its own database', async () => {
    const own = task('task-a', userA, 'Mine');
    await store.saveTaskAndEnqueue(own, {
      id: 'entry-a',
      entityId: own.id,
      change: {
        entity: EChangedEntity.Task,
        action: EChangeAction.Created,
        object: own,
      },
    });

    await store.open(userB);
    expect(await store.loadAll()).toMatchObject({ tasks: [], outbox: [], syncedRevision: 0 });

    await store.open(userA);
    const restored = await store.loadAll();
    expect(restored.tasks.map(item => item.title)).toEqual(['Mine']);
    expect(restored.outbox.map(entry => entry.id)).toEqual(['entry-a']);
    expect((await store.listOutbox()).map(entry => entry.id)).toEqual(['entry-a']);
  });

  it('applies server changes and the revision in one snapshot, skipping pending entities', async () => {
    const pending = task('task-pending', userA, 'Local title');
    await store.saveTaskAndEnqueue(pending, {
      id: 'entry-pending',
      entityId: pending.id,
      change: {
        entity: EChangedEntity.Task,
        action: EChangeAction.Updated,
        object: pending,
      },
    });

    const other = task('task-other', userA, 'From server');
    const applied = await store.applyServerChangesAndRevision(
      [serverUpdate({ ...pending, title: 'Server title' }), serverUpdate(other)],
      150,
    );

    expect(applied.map(change => change.object?.id)).toEqual(['task-other']);
    const snapshot = await store.loadAll();
    expect(snapshot.tasks.find(item => item.id === pending.id)?.title).toBe('Local title');
    expect(snapshot.tasks.find(item => item.id === other.id)?.title).toBe('From server');
    expect(snapshot.syncedRevision).toBe(150);
    expect(snapshot.outbox).toHaveLength(1);
  });

  it('does not move the revision backwards', async () => {
    await store.open(userA);
    await store.applyServerChangesAndRevision([], 150);
    await store.applyServerChangesAndRevision([], 10);

    expect((await store.loadAll()).syncedRevision).toBe(150);
  });

  it('drops a task write when the transaction aborts', async () => {
    await database.open('user-rollback');
    const db = await database.getDatabase();
    const row = task('task-rollback', 'user-rollback', 'Gone');

    await expect(
      commitReadWrite(
        db,
        [DATABASE_CONFIG.STORES.TASKS, DATABASE_CONFIG.STORES.OUTBOX],
        async tx => {
          await tx.objectStore(DATABASE_CONFIG.STORES.TASKS).put(row);
          throw new Error('disk');
        },
      ),
    ).rejects.toThrow('disk');

    await store.open('user-rollback');
    expect((await store.loadAll()).tasks).toEqual([]);
  });

  it('drops image and audio blobs when the task is deleted locally', async () => {
    const row = taskWithMedia('task-local-delete', userA);
    await seedMedia(store, database, row, ['keep-image']);

    await store.deleteTaskAndEnqueue(userA, row.id, {
      id: 'entry-delete',
      entityId: row.id,
      change: {
        entity: EChangedEntity.Task,
        action: EChangeAction.Deleted,
        object: { id: row.id, modifiedAt: row.modifiedAt },
      },
    });

    const db = await database.getDatabase();
    expect(await db.get(DATABASE_CONFIG.STORES.TASKS, row.id)).toBeUndefined();
    expect(await db.get(DATABASE_CONFIG.STORES.IMAGES, 'cover-image')).toBeUndefined();
    expect(await db.get(DATABASE_CONFIG.STORES.IMAGES, 'gallery-image')).toBeUndefined();
    expect(await db.get(DATABASE_CONFIG.STORES.AUDIO, 'audio-clip')).toBeUndefined();
    expect(await db.get(DATABASE_CONFIG.STORES.IMAGES, 'keep-image')).toMatchObject({
      id: 'keep-image',
    });
    expect((await store.listOutbox()).map(entry => entry.id)).toEqual(['entry-delete']);
  });

  it('drops image and audio blobs when a server delete arrives', async () => {
    const row = taskWithMedia('task-server-delete', userA);
    await seedMedia(store, database, row, ['keep-image']);

    const applied = await store.applyServerChangesAndRevision(
      [
        {
          entity: EChangedEntity.Task,
          action: EChangeAction.Deleted,
          object: { id: row.id, modifiedAt: row.modifiedAt },
        },
      ],
      4,
    );

    const db = await database.getDatabase();
    expect(applied.map(change => change.object?.id)).toEqual([row.id]);
    expect(await db.get(DATABASE_CONFIG.STORES.TASKS, row.id)).toBeUndefined();
    expect(await db.get(DATABASE_CONFIG.STORES.IMAGES, 'cover-image')).toBeUndefined();
    expect(await db.get(DATABASE_CONFIG.STORES.IMAGES, 'gallery-image')).toBeUndefined();
    expect(await db.get(DATABASE_CONFIG.STORES.AUDIO, 'audio-clip')).toBeUndefined();
    expect(await db.get(DATABASE_CONFIG.STORES.IMAGES, 'keep-image')).toMatchObject({
      id: 'keep-image',
    });
  });

  it('drops image and audio blobs when the local task is removed after a 404', async () => {
    const row = taskWithMedia('task-not-found', userA);
    await seedMedia(store, database, row, []);

    await store.removeLocalEntity(EChangedEntity.Task, row.id);

    const db = await database.getDatabase();
    expect(await db.get(DATABASE_CONFIG.STORES.TASKS, row.id)).toBeUndefined();
    expect(await db.get(DATABASE_CONFIG.STORES.IMAGES, 'cover-image')).toBeUndefined();
    expect(await db.get(DATABASE_CONFIG.STORES.AUDIO, 'audio-clip')).toBeUndefined();
  });

  it('removes the legacy store key only after the database opens', async () => {
    const session = TestBed.inject(LocalSessionService);
    localStorage.setItem(LEGACY_NGXS_STATE_KEY, '{"tasks":{"entities":[]}}');

    await session.openAndLoad(userA);
    expect(localStorage.getItem(LEGACY_NGXS_STATE_KEY)).toBeNull();

    localStorage.setItem(LEGACY_NGXS_STATE_KEY, 'keep');
    jest.spyOn(database, 'open').mockRejectedValueOnce(new Error('nope'));
    await expect(session.openAndLoad(userB)).rejects.toThrow('nope');
    expect(localStorage.getItem(LEGACY_NGXS_STATE_KEY)).toBe('keep');
  });
});

function taskWithMedia(id: string, userId: string): Task {
  return {
    ...task(id, userId, 'With media'),
    imageId: 'cover-image',
    images: ['gallery-image'],
    audioAttachments: [
      {
        id: 'audio-clip',
        durationMs: 1000,
        mimeType: 'audio/webm',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ],
  };
}

async function seedMedia(
  store: LocalStore,
  database: DatabaseService,
  row: Task,
  extraImageIds: string[],
): Promise<void> {
  await store.open(row.userId);
  const db = await database.getDatabase();
  await commitReadWrite(
    db,
    [DATABASE_CONFIG.STORES.TASKS, DATABASE_CONFIG.STORES.IMAGES, DATABASE_CONFIG.STORES.AUDIO],
    async tx => {
      await tx.objectStore(DATABASE_CONFIG.STORES.TASKS).put(row);
      for (const id of ['cover-image', 'gallery-image', ...extraImageIds]) {
        await tx.objectStore(DATABASE_CONFIG.STORES.IMAGES).put({ id, uploaded: true });
      }
      await tx.objectStore(DATABASE_CONFIG.STORES.AUDIO).put({ id: 'audio-clip', uploaded: false });
    },
  );
}

function deleteDatabase(name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(name);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => resolve();
  });
}
