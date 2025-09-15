import { Injectable } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { ClientIdService } from 'src/app/shared/services/api/client-id.service';
import { AppAction } from './app.actions';
import { HttpErrorResponse } from '@angular/common/http';
import { Change, EChangeAction } from '../models/change.model';
import { append, patch, removeItem } from '@ngxs/store/operators';
import { ServerChangesService } from '../services/api/server-changes.service';
import { ClientChangesService } from '../services/api/client-changes.service';
import { AuthAPIAction } from '../services/api/auth.actions';
import { EMPTY, Observable, catchError, concat, lastValueFrom, tap } from 'rxjs';
import { SyncServiceAPIAction } from '../services/api/server-changes.actions';
import { SyncAction } from './sync.action';
import { ImageService } from '../services/infrastructure/image.service';

export interface SyncStateModel {
  clientId: string;
  lastTime: Date;
  changes: Change[];
}

@State<SyncStateModel>({
  name: 'sync',
  defaults: {
    clientId: null,
    lastTime: null,
    changes: [],
  },
})
@Injectable()
export class SyncState {
  readonly SYNC_PERIOD = 1000 * 20; // sync interval 20 sec;
  private intervalId: null | ReturnType<typeof setTimeout> = null;

  constructor(
    private readonly clientIdSerivce: ClientIdService,
    private readonly clientChangesService: ClientChangesService,
    private readonly serverChangesService: ServerChangesService,
    private readonly imageService: ImageService,
  ) {}

  @Selector()
  static lastSyncTime(state: SyncStateModel): Date {
    return new Date(state.lastTime);
  }

  @Action(SyncAction.ChangeForSyncOccurred)
  changeOccurred(ctx: StateContext<SyncStateModel>, { change }: { change: Change }): void {
    ctx.setState(
      patch({
        changes: append([change]),
      }),
    );

    this.synchronizeApp(ctx);
  }

  @Action(SyncServiceAPIAction.LocalChangeWasSynchronized)
  @Action(SyncAction.LocalChangeWasCanceled)
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
      this.synchronizeApp(ctx);
    }, this.SYNC_PERIOD);
  }

  @Action(AuthAPIAction.UserLoggedOut)
  @Action(AppAction.UserNotAuthenticated)
  clearTimer(): void {
    clearInterval(this.intervalId);
  }

  private async synchronizeApp(ctx: StateContext<SyncStateModel>): Promise<void> {
    const syncApiCalls: Observable<void | Change[] | string>[] = [];
    if (!ctx.getState().clientId) {
      const clientId: string = await lastValueFrom(this.getClientIdAPICall(ctx));
      ctx.patchState({ clientId });
    }
    syncApiCalls.push(this.fetchServerChanges(ctx));
    syncApiCalls.push(this.syncPendingChanges(ctx));
    concat(...syncApiCalls)
      .pipe(
        tap({
          next: () => {
            ctx.patchState({ lastTime: new Date() });
          },
        }),
      )
      .subscribe();

    this.imageService.uploadImages();
  }

  private fetchServerChanges(ctx: StateContext<SyncStateModel>): Observable<Change[]> {
    return this.serverChangesService.fetch(ctx.getState().clientId).pipe(
      tap({
        next: (changes: Change[]) => {
          ctx.dispatch(new SyncServiceAPIAction.ServerChangesLoaded(changes));
        },
        error: err => {
          ctx.dispatch(SyncServiceAPIAction.ServerChangesLoadingFailed);
          return err;
        },
      }),
    );
  }

  private syncPendingChanges(ctx: StateContext<SyncStateModel>): Observable<void> {
    const apiCalls = ctx.getState().changes.map(change =>
      this.clientChangesService.send(change).pipe(
        tap({
          next: () => {
            ctx.dispatch(new SyncServiceAPIAction.LocalChangeWasSynchronized(change));
          },
          error: error => {
            console.error('Sync Pending Change Error:', change, error);

            if (error instanceof HttpErrorResponse && error.status === 404) {
              this.handleEntity404(ctx, change);
              return;
            }

            ctx.dispatch(new SyncAction.LocalChangeWasCanceled(change));
          },
        }),
        catchError(() => EMPTY),
      ),
    );
    return concat(...apiCalls);
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

  private handleEntity404(ctx: StateContext<SyncStateModel>, change: Change): void {
    // The entity did not found on server
    // so we need to dispatch Delete Change action locally
    // to be synchronized with server
    const deleteChange: Change = {
      entity: change.entity,
      action: EChangeAction.Deleted,
      object: {
        id: change.object.id,
        modifiedAt: new Date().toISOString(),
      },
    };
    ctx.dispatch(new SyncServiceAPIAction.ServerChangesLoaded([deleteChange]));
    ctx.dispatch(new SyncAction.LocalChangeWasCanceled(change));

    // TICKET: https://brainas.atlassian.net/browse/BA-136
    // TODO: Notify user about error happened and task was deleted
  }
}
