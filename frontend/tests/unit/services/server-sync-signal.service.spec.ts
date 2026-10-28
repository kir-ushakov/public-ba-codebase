import { TestBed } from '@angular/core/testing';
import { Actions, ofActionSuccessful, provideStore, Store } from '@ngxs/store';
import { firstValueFrom, of } from 'rxjs';
import { ServerChangesService } from 'src/app/shared/services/api/server-changes.service';
import { ServerSyncSignalService } from 'src/app/shared/services/api/server-sync-signal.service';
import { OutboundSyncService } from 'src/app/shared/services/application/outbound-sync.service';
import { SyncAction } from 'src/app/shared/state/sync.action';
import { SyncState, SyncStateModel } from 'src/app/shared/state/sync.state';
import { TasksState } from 'src/app/shared/state/tasks.state';

describe('ServerSyncSignalService', () => {
  let store: Store;
  let signal: ServerSyncSignalService;
  let serverChangesService: { fetch: jest.Mock };

  beforeEach(() => {
    serverChangesService = {
      fetch: jest.fn(() => of({ changes: [], syncRevision: 0 })),
    };

    TestBed.configureTestingModule({
      providers: [
        provideStore([SyncState, TasksState]),
        ServerSyncSignalService,
        { provide: ServerChangesService, useValue: serverChangesService },
        {
          provide: OutboundSyncService,
          useValue: {
            process: jest.fn(async () => ({
              sent: [],
              notFound: [],
              missingBlobDiscards: [],
              sendFailed: false,
            })),
          },
        },
      ],
    });

    store = TestBed.inject(Store);
    signal = TestBed.inject(ServerSyncSignalService);
  });

  it('pulls when the signal version is newer and leaves the cursor to that pull', async () => {
    store.reset({
      sync: { lastTime: null, changes: [], syncedRevision: 5 },
      tasks: { entities: [] },
    });

    const actions$ = TestBed.inject(Actions);
    const completed = firstValueFrom(actions$.pipe(ofActionSuccessful(SyncAction.Synchronize)));
    signal.handleAvailableVersion(8);
    await completed;

    expect(serverChangesService.fetch).toHaveBeenCalledWith(5);
    expect(syncSnapshot().syncedRevision).toBe(5);
  });

  it('ignores a signal version the client already has', () => {
    store.reset({
      sync: { lastTime: null, changes: [], syncedRevision: 5 },
      tasks: { entities: [] },
    });

    signal.handleAvailableVersion(5);

    expect(serverChangesService.fetch).not.toHaveBeenCalled();
    expect(syncSnapshot().syncedRevision).toBe(5);
  });

  function syncSnapshot(): SyncStateModel {
    return store.selectSnapshot(state => state.sync);
  }
});
