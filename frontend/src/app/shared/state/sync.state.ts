import { Injectable } from '@angular/core';
import { Action, State, StateContext } from '@ngxs/store';
import { EChangeAction } from '@brainassistant/contracts';
import { ClientIdService } from 'src/app/shared/services/api/client-id.service';
import { AppAction } from './app.actions';
import { HttpErrorResponse } from '@angular/common/http';
import { Change } from '../models/change.model';
import { append, patch, removeItem } from '@ngxs/store/operators';
import { ServerChangesService } from '../services/api/server-changes.service';
import { ClientChangesService } from '../services/api/client-changes.service';
import { Observable, lastValueFrom, tap } from 'rxjs';
import { SyncAction } from './sync.action';
import { ImageService } from '../services/application/image.service';
import { UserAction } from './user.actions';


export interface SyncStateModel {
  clientId: string;
  lastTime: Date;
  changes: Change[];
}

@State<SyncStateModel>({
  name: 'sync',
  defaults: SyncState.defaults,
})
@Injectable()
export class SyncState {
  static readonly defaults: SyncStateModel = {
    clientId: null,
    lastTime: null,
    changes: [],
  };

  readonly SYNC_PERIOD = 1000 * 20; // sync interval 20 sec;
  private intervalId: null | ReturnType<typeof setTimeout> = null;

  constructor(
    private readonly clientIdSerivce: ClientIdService,
    private readonly clientChangesService: ClientChangesService,
    private readonly serverChangesService: ServerChangesService,
    private readonly imageService: ImageService,
  ) {}

  @Action(SyncAction.ChangeForSyncOccurred)
  changeOccurred(ctx: StateContext<SyncStateModel>, { change }: { change: Change }): void {
    ctx.setState(
      patch({
        changes: append([change]),
      }),
    );

    ctx.dispatch(new SyncAction.Synchronize());
  }

  @Action(SyncAction.LocalChangeWasSynchronized)
  clientChangesSynchronized(
    ctx: StateContext<SyncStateModel>,
    { change }: { change: Change },
  ): void {
    ctx.setState(
      patch({
        changes: removeItem<Change>(ch => ch === change),
      }),
    );
  }

  @Action(AppAction.Opened)
  updateSyncTimer(ctx: StateContext<SyncStateModel>): void {
    clearInterval(this.intervalId);
    this.intervalId = setInterval(() => {
      ctx.dispatch(new SyncAction.Synchronize());
    }, this.SYNC_PERIOD);
  }

  @Action(UserAction.LoggedOut)
  @Action(AppAction.UserNotAuthenticated)
  clearTimer(): void {
    clearInterval(this.intervalId);
  }

  @Action(SyncAction.Synchronize)
  async synchronize(ctx: StateContext<SyncStateModel>): Promise<void> {
    if (!ctx.getState().clientId) {
      const clientId: string = await lastValueFrom(this.getClientIdAPICall(ctx));
      ctx.patchState({ clientId });
    }
    try {
      await this.fetchServerChanges(ctx);
      await this.syncPendingChanges(ctx);
  
      ctx.patchState({ lastTime: new Date() });
      
      await this.imageService.uploadImages();
    } catch (err) {
      // TODO: Don't rely only on HTTP status code - check error name from backend response
      // TICKET: https://brainas.atlassian.net/browse/BA-258
      if (err instanceof HttpErrorResponse && err.status === 404) {
        this.handleClientIdNotFoundError(ctx);
      } else {
        ctx.dispatch(SyncAction.SyncinhriniziationWasFailed);
      }
    }
  }

  private async fetchServerChanges(ctx: StateContext<SyncStateModel>): Promise<void> {
    const changes = await lastValueFrom(
      this.serverChangesService.fetch(ctx.getState().clientId)
    );
    ctx.dispatch(new SyncAction.ServerChangesLoaded(changes));
  }

  private async syncPendingChanges(ctx: StateContext<SyncStateModel>): Promise<void> {
    const changes = ctx.getState().changes;
    
    for (const change of changes) {
      try {
        await lastValueFrom(this.clientChangesService.send(change));
        ctx.dispatch(new SyncAction.LocalChangeWasSynchronized(change));
      } catch (error) {
        console.error('Sync Pending Change Error:', change, error);
        
        // TODO: Don't rely only on HTTP status code - check error name from backend response
        // TICKET: https://brainas.atlassian.net/browse/BA-258
        if (error instanceof HttpErrorResponse && error.status === 404) {
          this.handleEntityNotFoundError(ctx, change);
        } else {
          // TODO: Notify user about temporary sync failure
          // TODO: Consider exponential backoff for retry
          // TODO: Maybe consider adding logic to mark unsynced changes as failed and give user option to retry sync manually
          // TICKET: https://brainas.atlassian.net/browse/BA-259
          // For now, keep in queue - will retry on next sync interval (20 sec)
          // This prevents data loss from temporary network issues
          // we can not continue sync process, because we can not know if change was successfully synchronized or not
          // so we need to stop sync process and notify user about sync failure
          ctx.dispatch(SyncAction.SyncinhriniziationWasFailed);
          return;
        }
      }
    }
  }

  private getClientIdAPICall(ctx: StateContext<SyncStateModel>): Observable<string> {
    return this.clientIdSerivce.releaseClientId().pipe(
      tap({
        next: clientId => {
          ctx.patchState({ clientId: clientId });
        },
        error: err => {
          console.log(err);
          return err;
        },
      }),
    );
  }

  private handleClientIdNotFoundError(ctx: StateContext<SyncStateModel>): void {
    ctx.patchState({ 
      clientId: null,
      lastTime: null 
    });
    ctx.dispatch(new SyncAction.Synchronize());
  }

  private handleEntityNotFoundError(ctx: StateContext<SyncStateModel>, change: Change): void {
    // Entity not found on server - create local delete change to sync state with server
    const deleteChange: Change = {
      entity: change.entity,
      action: EChangeAction.Deleted,
      object: {
        id: change.object.id,
        modifiedAt: new Date().toISOString(),
      },
    };
    ctx.dispatch(new SyncAction.ServerChangesLoaded([deleteChange]));
    ctx.dispatch(new SyncAction.LocalChangeWasSynchronized(change));

    // TODO: Notify user that entity was deleted on server
    // TICKET: https://brainas.atlassian.net/browse/BA-136
  }
}
