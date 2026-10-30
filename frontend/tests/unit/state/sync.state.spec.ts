import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Actions, ofActionDispatched, provideStore, Store } from '@ngxs/store';
import { EChangeAction, EChangedEntity } from '@brainassistant/contracts';
import { firstValueFrom, of, throwError } from 'rxjs';
import { Change } from 'src/app/shared/models/change.model';
import { OutboxEntry } from 'src/app/shared/models/outbox-entry.type';
import { ETaskStatus, ETaskType, Task } from 'src/app/shared/models/task.model';
import { ServerChangesService } from 'src/app/shared/services/api/server-changes.service';
import {
  OutboundSyncResult,
  OutboundSyncService,
} from 'src/app/shared/services/application/outbound-sync.service';
import { LocalStore } from 'src/app/shared/services/infrastructure/local-store.service';
import { AppAction } from 'src/app/shared/state/app.actions';
import { AppState } from 'src/app/shared/state/app.state';
import { SyncAction } from 'src/app/shared/state/sync.action';
import { SyncState, SyncStateModel } from 'src/app/shared/state/sync.state';
import { TasksState } from 'src/app/shared/state/tasks.state';

describe('SyncState', () => {
  let store: Store;
  let actions$: Actions;
  let serverChangesService: { fetch: jest.Mock };
  let outboundSyncService: { process: jest.Mock };
  let idbOutbox: OutboxEntry[];
  let localStore: {
    applyServerChangesAndRevision: jest.Mock;
    listOutbox: jest.Mock;
    removeOutboxEntry: jest.Mock;
    removeOutboxEntries: jest.Mock;
    removeLocalEntity: jest.Mock;
    deleteTaskAndEnqueue: jest.Mock;
  };

  const pendingChange: Change = {
    entity: EChangedEntity.Task,
    action: EChangeAction.Created,
    object: { id: 'task-1', modifiedAt: '2025-01-15T12:00:00.000Z' },
  };
  const pendingEntry: OutboxEntry = {
    id: 'outbox-1',
    entityId: 'task-1',
    change: pendingChange,
  };

  const emptyResult: OutboundSyncResult = {
    sent: [],
    notFound: [],
    missingBlobDiscards: [],
    sendFailed: false,
  };

  beforeEach(() => {
    serverChangesService = {
      fetch: jest.fn(() => of({ changes: [], syncRevision: 0 })),
    };
    outboundSyncService = {
      process: jest.fn(async (changes: Change[]) => ({ ...emptyResult, sent: changes })),
    };
    idbOutbox = [];
    localStore = {
      applyServerChangesAndRevision: jest.fn(async (changes: Change[]) => changes),
      listOutbox: jest.fn(async () => idbOutbox.map(entry => entry)),
      removeOutboxEntry: jest.fn(async (id: string) => {
        idbOutbox = idbOutbox.filter(entry => entry.id !== id);
      }),
      removeOutboxEntries: jest.fn(async (ids: string[]) => {
        idbOutbox = idbOutbox.filter(entry => !ids.includes(entry.id));
      }),
      removeLocalEntity: jest.fn().mockResolvedValue(undefined),
      deleteTaskAndEnqueue: jest.fn(
        async (_userId: string, _taskId: string, entry: OutboxEntry) => {
          idbOutbox = [...idbOutbox, entry];
        },
      ),
    };

    TestBed.configureTestingModule({
      providers: [
        provideStore([AppState, SyncState, TasksState]),
        { provide: ServerChangesService, useValue: serverChangesService },
        { provide: OutboundSyncService, useValue: outboundSyncService },
        { provide: LocalStore, useValue: localStore },
      ],
    });

    store = TestBed.inject(Store);
    actions$ = TestBed.inject(Actions);
  });

  afterEach(() => {
    store.dispatch(new AppAction.UserNotAuthenticated());
    jest.useRealTimers();
  });

  it('stores the revision after applying server changes', async () => {
    resetState({ lastTime: null, outbox: [], syncedRevision: 0 });
    serverChangesService.fetch.mockReturnValue(of({ changes: [], syncRevision: 4 }));

    await firstValueFrom(store.dispatch(new SyncAction.Synchronize()));

    expect(serverChangesService.fetch).toHaveBeenCalledWith(0);
    expect(syncSnapshot().syncedRevision).toBe(4);
  });

  it('keeps a newer local revision when an older response arrives', async () => {
    resetState({ lastTime: null, outbox: [], syncedRevision: 10 });
    serverChangesService.fetch.mockReturnValue(of({ changes: [], syncRevision: 4 }));

    await firstValueFrom(store.dispatch(new SyncAction.Synchronize()));

    expect(serverChangesService.fetch).toHaveBeenCalledWith(10);
    expect(syncSnapshot().syncedRevision).toBe(10);
  });

  it('starts a sync cycle immediately when the app opens', async () => {
    resetState({ lastTime: null, outbox: [] });

    await firstValueFrom(store.dispatch(new AppAction.Opened()));

    expect(serverChangesService.fetch).toHaveBeenCalledWith(0);
    expect(outboundSyncService.process).toHaveBeenCalledWith([]);
  });

  it('repeats the sync cycle on the interval after the app opens', async () => {
    jest.useFakeTimers();
    resetState({ lastTime: null, outbox: [] });

    await firstValueFrom(store.dispatch(new AppAction.Opened()));
    expect(serverChangesService.fetch).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(20_000);

    expect(serverChangesService.fetch).toHaveBeenCalledTimes(2);
  });

  it('sends an IndexedDB outbox entry that is missing from the in-memory projection', async () => {
    resetState({ lastTime: null, outbox: [] });
    idbOutbox = [pendingEntry];

    await firstValueFrom(store.dispatch(new SyncAction.Synchronize()));

    expect(outboundSyncService.process).toHaveBeenCalledWith([pendingChange]);
    expect(localStore.removeOutboxEntry).toHaveBeenCalledWith('outbox-1');
    expect(syncSnapshot().outbox).toEqual([]);
  });

  it('enqueues a local change and removes only the entry outbound sync reports as sent', async () => {
    const newerChange: Change = {
      ...pendingChange,
      object: { id: 'task-1', modifiedAt: '2025-01-15T13:00:00.000Z' },
    };
    const newerEntry: OutboxEntry = {
      id: 'outbox-2',
      entityId: 'task-1',
      change: newerChange,
    };
    outboundSyncService.process.mockImplementation(async (changes: Change[]) => ({
      ...emptyResult,
      sent: changes.filter(change => change === pendingChange),
    }));
    resetState({ lastTime: null, outbox: [pendingEntry, newerEntry] });

    await firstValueFrom(store.dispatch(new SyncAction.Synchronize()));

    expect(outboundSyncService.process).toHaveBeenCalledWith([pendingChange, newerChange]);
    expect(localStore.removeOutboxEntry).toHaveBeenCalledTimes(1);
    expect(localStore.removeOutboxEntry).toHaveBeenCalledWith('outbox-1');
    expect(syncSnapshot().outbox).toEqual([newerEntry]);
  });

  it('keeps the queue and reports failure when outbound sync cannot send', async () => {
    outboundSyncService.process.mockResolvedValue({ ...emptyResult, sendFailed: true });
    resetState({ lastTime: null, outbox: [pendingEntry] });

    const failed: SyncAction.SyncinhriniziationWasFailed[] = [];
    const sub = actions$
      .pipe(ofActionDispatched(SyncAction.SyncinhriniziationWasFailed))
      .subscribe(action => failed.push(action));

    await firstValueFrom(store.dispatch(new SyncAction.Synchronize()));
    sub.unsubscribe();

    expect(syncSnapshot().outbox).toEqual([pendingEntry]);
    expect(failed).toHaveLength(1);
  });

  it('removes a local task when outbound sync reports a missing photo blob', async () => {
    const taskWithPhoto: Task = {
      id: 'task-photo',
      userId: 'user-1',
      type: ETaskType.Basic,
      title: 'Photo task',
      imageId: 'img-1',
      status: ETaskStatus.Todo,
      createdAt: '2025-01-15T12:00:00.000Z',
      modifiedAt: '2025-01-15T12:00:00.000Z',
    };
    const photoCreate: Change = {
      entity: EChangedEntity.Task,
      action: EChangeAction.Created,
      object: taskWithPhoto,
    };
    const photoEntry: OutboxEntry = {
      id: 'outbox-photo',
      entityId: taskWithPhoto.id,
      change: photoCreate,
    };
    outboundSyncService.process.mockImplementation(async (changes: Change[]) => {
      const hasUnsentPhotoCreate = changes.some(
        change => change.action === EChangeAction.Created && change.object?.id === taskWithPhoto.id,
      );
      if (hasUnsentPhotoCreate) {
        return {
          ...emptyResult,
          missingBlobDiscards: [{ taskId: taskWithPhoto.id, imageId: 'img-1' }],
        };
      }
      return { ...emptyResult, sent: changes };
    });
    resetState({ lastTime: null, outbox: [photoEntry] }, [taskWithPhoto]);

    const errors: AppAction.ShowErrorInUI[] = [];
    const sub = actions$
      .pipe(ofActionDispatched(AppAction.ShowErrorInUI))
      .subscribe(action => errors.push(action));

    await firstValueFrom(store.dispatch(new SyncAction.Synchronize()));
    sub.unsubscribe();

    expect(errors).toHaveLength(1);
    expect(store.selectSnapshot(AppState.uiError)).toEqual({
      title: 'The task photo is missing. The task was removed.',
      body: '',
    });
    expect(
      store.selectSnapshot((state: { tasks: { entities: Task[] } }) => state.tasks.entities),
    ).toEqual([]);
    expect(
      syncSnapshot().outbox.some(
        entry => entry.change.action === EChangeAction.Created && entry.entityId === 'task-photo',
      ),
    ).toBe(false);
  });

  it('reports sync failure when fetching changes returns 404', async () => {
    resetState({ lastTime: null, outbox: [] });
    serverChangesService.fetch.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 404,
            statusText: 'Not Found',
            url: '/api/sync/changes',
          }),
      ),
    );

    const failed: SyncAction.SyncinhriniziationWasFailed[] = [];
    const sub = actions$
      .pipe(ofActionDispatched(SyncAction.SyncinhriniziationWasFailed))
      .subscribe(action => failed.push(action));

    await firstValueFrom(store.dispatch(new SyncAction.Synchronize()));
    sub.unsubscribe();

    expect(failed).toHaveLength(1);
    expect(serverChangesService.fetch).toHaveBeenCalledTimes(1);
  });

  function resetState(
    sync: Omit<SyncStateModel, 'syncedRevision'> & { syncedRevision?: number },
    tasks: Task[] = [],
  ): void {
    idbOutbox = [...sync.outbox];
    store.reset({
      app: { online: false, uiError: null },
      sync: { syncedRevision: 0, ...sync },
      tasks: { entities: tasks },
    });
  }

  function syncSnapshot(): SyncStateModel {
    return store.selectSnapshot(state => state.sync);
  }
});
