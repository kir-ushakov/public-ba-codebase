import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Actions, ofActionDispatched, provideStore, Store } from '@ngxs/store';
import { EChangeAction, EChangedEntity } from '@brainassistant/contracts';
import { firstValueFrom, of, Subject, throwError } from 'rxjs';
import { Change } from 'src/app/shared/models/change.model';
import { ClientChangesService } from 'src/app/shared/services/api/client-changes.service';
import { ClientIdService } from 'src/app/shared/services/api/client-id.service';
import { ServerChangesService } from 'src/app/shared/services/api/server-changes.service';
import { ImageService } from 'src/app/shared/services/application/image.service';
import { SyncAction } from 'src/app/shared/state/sync.action';
import { SyncState, SyncStateModel } from 'src/app/shared/state/sync.state';

describe('SyncState', () => {
  let store: Store;
  let actions$: Actions;
  let clientIdService: { releaseClientId: jest.Mock };
  let serverChangesService: { fetch: jest.Mock };
  let clientChangesService: { send: jest.Mock };
  let imageService: { uploadImages: jest.Mock };

  const pendingChange: Change = {
    entity: EChangedEntity.Task,
    action: EChangeAction.Created,
    object: { id: 'task-1', modifiedAt: '2025-01-15T12:00:00.000Z' },
  };

  beforeEach(() => {
    clientIdService = { releaseClientId: jest.fn(() => of('client-1')) };
    serverChangesService = { fetch: jest.fn(() => of([])) };
    clientChangesService = { send: jest.fn(() => of({})) };
    imageService = { uploadImages: jest.fn().mockResolvedValue(undefined) };

    TestBed.configureTestingModule({
      providers: [
        provideStore([SyncState]),
        { provide: ClientIdService, useValue: clientIdService },
        { provide: ServerChangesService, useValue: serverChangesService },
        { provide: ClientChangesService, useValue: clientChangesService },
        { provide: ImageService, useValue: imageService },
      ],
    });

    store = TestBed.inject(Store);
    actions$ = TestBed.inject(Actions);
  });

  it('enqueues a local change and removes it after a successful send', async () => {
    resetSync({ clientId: 'client-1', lastTime: null, changes: [pendingChange] });

    await firstValueFrom(store.dispatch(new SyncAction.Synchronize()));

    expect(clientChangesService.send).toHaveBeenCalledWith(pendingChange);
    expect(syncSnapshot().changes).toEqual([]);
  });

  it('stops the queue on a non-404 send error and keeps the pending change', async () => {
    const first: Change = { ...pendingChange, object: { id: 'task-a', modifiedAt: 't' } };
    const second: Change = { ...pendingChange, object: { id: 'task-b', modifiedAt: 't' } };
    resetSync({ clientId: 'client-1', lastTime: null, changes: [first, second] });

    clientChangesService.send.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500, statusText: 'Server Error' })),
    );

    const failed: SyncAction.SyncinhriniziationWasFailed[] = [];
    const sub = actions$
      .pipe(ofActionDispatched(SyncAction.SyncinhriniziationWasFailed))
      .subscribe(action => failed.push(action));

    await firstValueFrom(store.dispatch(new SyncAction.Synchronize()));
    sub.unsubscribe();

    expect(clientChangesService.send).toHaveBeenCalledTimes(1);
    expect(syncSnapshot().changes).toEqual([first, second]);
    expect(failed).toHaveLength(1);
  });

  it('clears clientId on fetch 404 and allocates a new one on the retry', async () => {
    resetSync({ clientId: 'stale-client', lastTime: null, changes: [] });

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

  it('does not drain the rest of the queue while a send is in flight', async () => {
    const first: Change = { ...pendingChange, object: { id: 'task-a', modifiedAt: 't' } };
    const second: Change = { ...pendingChange, object: { id: 'task-b', modifiedAt: 't' } };
    resetSync({ clientId: 'client-1', lastTime: null, changes: [first, second] });

    const sendGate = new Subject<unknown>();
    clientChangesService.send
      .mockReturnValueOnce(sendGate.asObservable())
      .mockReturnValue(of({}));

    const syncDone = firstValueFrom(store.dispatch(new SyncAction.Synchronize()));

    await Promise.resolve();
    await Promise.resolve();

    expect(clientChangesService.send).toHaveBeenCalledTimes(1);
    expect(clientChangesService.send).toHaveBeenCalledWith(first);
    expect(syncSnapshot().changes).toEqual([first, second]);

    sendGate.next({});
    sendGate.complete();
    await syncDone;

    expect(clientChangesService.send).toHaveBeenCalledTimes(2);
    expect(syncSnapshot().changes).toEqual([]);
  });

  function resetSync(sync: SyncStateModel): void {
    store.reset({ sync });
  }

  function syncSnapshot(): SyncStateModel {
    return store.selectSnapshot(state => state.sync);
  }
});
