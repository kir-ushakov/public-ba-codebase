import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Actions, ofActionDispatched, provideStore, Store } from '@ngxs/store';
import { EChangeAction, EChangedEntity } from '@brainassistant/contracts';
import { firstValueFrom, of, throwError } from 'rxjs';
import { Change } from 'src/app/shared/models/change.model';
import { ETaskStatus, ETaskType, Task } from 'src/app/shared/models/task.model';
import { ServerChangesService } from 'src/app/shared/services/api/server-changes.service';
import { ServerSyncSignalService } from 'src/app/shared/services/api/server-sync-signal.service';
import {
  OutboundSyncResult,
  OutboundSyncService,
} from 'src/app/shared/services/application/outbound-sync.service';
import { AppAction } from 'src/app/shared/state/app.actions';
import { SyncAction } from 'src/app/shared/state/sync.action';
import { SyncState, SyncStateModel } from 'src/app/shared/state/sync.state';
import { TasksState } from 'src/app/shared/state/tasks.state';

describe('SyncState', () => {
  let store: Store;
  let actions$: Actions;
  let serverChangesService: { fetch: jest.Mock };
  let outboundSyncService: { process: jest.Mock };

  const pendingChange: Change = {
    entity: EChangedEntity.Task,
    action: EChangeAction.Created,
    object: { id: 'task-1', modifiedAt: '2025-01-15T12:00:00.000Z' },
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

    TestBed.configureTestingModule({
      providers: [
        provideStore([SyncState, TasksState]),
        { provide: ServerChangesService, useValue: serverChangesService },
        { provide: OutboundSyncService, useValue: outboundSyncService },
        {
          provide: ServerSyncSignalService,
          useValue: { start: () => undefined, stop: () => undefined },
        },
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
    resetState({ lastTime: null, changes: [], syncedRevision: 0 });
    serverChangesService.fetch.mockReturnValue(of({ changes: [], syncRevision: 4 }));

    await firstValueFrom(store.dispatch(new SyncAction.Synchronize()));

    expect(serverChangesService.fetch).toHaveBeenCalledWith(0);
    expect(syncSnapshot().syncedRevision).toBe(4);
  });

  it('keeps a newer local revision when an older response arrives', async () => {
    resetState({ lastTime: null, changes: [], syncedRevision: 10 });
    serverChangesService.fetch.mockReturnValue(of({ changes: [], syncRevision: 4 }));

    await firstValueFrom(store.dispatch(new SyncAction.Synchronize()));

    expect(serverChangesService.fetch).toHaveBeenCalledWith(10);
    expect(syncSnapshot().syncedRevision).toBe(10);
  });

  it('starts a sync cycle immediately when the app opens', async () => {
    resetState({ lastTime: null, changes: [] });

    await firstValueFrom(store.dispatch(new AppAction.Opened()));

    expect(serverChangesService.fetch).toHaveBeenCalledWith(0);
    expect(outboundSyncService.process).toHaveBeenCalledWith([]);
  });

  it('repeats the sync cycle on the interval after the app opens', async () => {
    jest.useFakeTimers();
    resetState({ lastTime: null, changes: [] });

    await firstValueFrom(store.dispatch(new AppAction.Opened()));
    expect(serverChangesService.fetch).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(60_000);

    expect(serverChangesService.fetch).toHaveBeenCalledTimes(2);
  });

  it('enqueues a local change and removes it after outbound sync reports it sent', async () => {
    resetState({ lastTime: null, changes: [pendingChange] });

    await firstValueFrom(store.dispatch(new SyncAction.Synchronize()));

    expect(outboundSyncService.process).toHaveBeenCalledWith([pendingChange]);
    expect(syncSnapshot().changes).toEqual([]);
  });

  it('keeps the queue and reports failure when outbound sync cannot send', async () => {
    outboundSyncService.process.mockResolvedValue({ ...emptyResult, sendFailed: true });
    resetState({ lastTime: null, changes: [pendingChange] });

    const failed: SyncAction.SyncinhriniziationWasFailed[] = [];
    const sub = actions$
      .pipe(ofActionDispatched(SyncAction.SyncinhriniziationWasFailed))
      .subscribe(action => failed.push(action));

    await firstValueFrom(store.dispatch(new SyncAction.Synchronize()));
    sub.unsubscribe();

    expect(syncSnapshot().changes).toEqual([pendingChange]);
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
    resetState({ lastTime: null, changes: [photoCreate] }, [taskWithPhoto]);

    const errors: AppAction.ShowErrorInUI[] = [];
    const sub = actions$
      .pipe(ofActionDispatched(AppAction.ShowErrorInUI))
      .subscribe(action => errors.push(action));

    await firstValueFrom(store.dispatch(new SyncAction.Synchronize()));
    sub.unsubscribe();

    expect(errors).toHaveLength(1);
    expect(
      store.selectSnapshot((state: { tasks: { entities: Task[] } }) => state.tasks.entities),
    ).toEqual([]);
    expect(
      syncSnapshot().changes.some(
        change => change.action === EChangeAction.Created && change.object?.id === 'task-photo',
      ),
    ).toBe(false);
  });

  it('reports sync failure when fetching changes returns 404', async () => {
    resetState({ lastTime: null, changes: [] });
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
    store.reset({
      sync: { syncedRevision: 0, ...sync },
      tasks: { entities: tasks },
    });
  }

  function syncSnapshot(): SyncStateModel {
    return store.selectSnapshot(state => state.sync);
  }
});
