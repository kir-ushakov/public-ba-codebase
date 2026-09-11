import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Actions, ofActionDispatched, provideStore, Store } from '@ngxs/store';
import { EChangeAction, EChangedEntity } from '@brainassistant/contracts';
import { firstValueFrom, of, throwError } from 'rxjs';
import { Change } from 'src/app/shared/models/change.model';
import { ETaskStatus, ETaskType, Task } from 'src/app/shared/models/task.model';
import { ClientIdService } from 'src/app/shared/services/api/client-id.service';
import { ServerChangesService } from 'src/app/shared/services/api/server-changes.service';
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
  let clientIdService: { releaseClientId: jest.Mock };
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
    clientIdService = { releaseClientId: jest.fn(() => of('client-1')) };
    serverChangesService = { fetch: jest.fn(() => of([])) };
    outboundSyncService = {
      process: jest.fn(async (changes: Change[]) => ({ ...emptyResult, sent: changes })),
    };

    TestBed.configureTestingModule({
      providers: [
        provideStore([SyncState, TasksState]),
        { provide: ClientIdService, useValue: clientIdService },
        { provide: ServerChangesService, useValue: serverChangesService },
        { provide: OutboundSyncService, useValue: outboundSyncService },
      ],
    });

    store = TestBed.inject(Store);
    actions$ = TestBed.inject(Actions);
  });

  it('enqueues a local change and removes it after outbound sync reports it sent', async () => {
    resetState({ clientId: 'client-1', lastTime: null, changes: [pendingChange] });

    await firstValueFrom(store.dispatch(new SyncAction.Synchronize()));

    expect(outboundSyncService.process).toHaveBeenCalledWith([pendingChange]);
    expect(syncSnapshot().changes).toEqual([]);
  });

  it('keeps the queue and reports failure when outbound sync cannot send', async () => {
    outboundSyncService.process.mockResolvedValue({ ...emptyResult, sendFailed: true });
    resetState({ clientId: 'client-1', lastTime: null, changes: [pendingChange] });

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
    resetState({ clientId: 'client-1', lastTime: null, changes: [photoCreate] }, [taskWithPhoto]);

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

  it('clears clientId on fetch 404 and allocates a new one on the retry', async () => {
    resetState({ clientId: 'stale-client', lastTime: null, changes: [] });

    serverChangesService.fetch
      .mockReturnValueOnce(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 404,
              statusText: 'Not Found',
              url: '/api/sync/changes',
            }),
        ),
      )
      .mockReturnValue(of([]));
    clientIdService.releaseClientId.mockReturnValue(of('client-2'));

    await firstValueFrom(store.dispatch(new SyncAction.Synchronize()));

    expect(clientIdService.releaseClientId).toHaveBeenCalled();
    expect(syncSnapshot().clientId).toBe('client-2');
    expect(serverChangesService.fetch).toHaveBeenCalledWith('client-2');
  });

  function resetState(sync: SyncStateModel, tasks: Task[] = []): void {
    store.reset({
      sync,
      tasks: { entities: tasks },
    });
  }

  function syncSnapshot(): SyncStateModel {
    return store.selectSnapshot(state => state.sync);
  }
});
