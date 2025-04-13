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
import { EMPTY, Observable, concat, lastValueFrom, tap } from 'rxjs';
import { SyncServiceAPIAction } from '../services/api/server-changes.actions';
import { AppError } from '../core/app.error';

export interface SyncStateModel {
  clientId: string;
  lastTime: Date;
  changes: Change[];
}

enum ESyncStateApiError {
  INVALID_CLIENT_ID = 'API_ERROR_INVALID_CLIENT_ID',
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
  private _intervalId: null | ReturnType<typeof setTimeout> = null;

  constructor(
    private _clientIdSerivce: ClientIdService,
    private _clientChangesService: ClientChangesService,
    private _serverChangesService: ServerChangesService,
  ) {}

  @Selector()
  static lastSyncTime(state: SyncStateModel): Date {
    return new Date(state.lastTime);
  }

  @Action(AppAction.ChangeForSyncOccurred)
  changeOccurred(ctx: StateContext<SyncStateModel>, { change }: { change: Change }): void {
    ctx.setState(
      patch({
        changes: append([change]),
      }),
    );

    this.synchronizeApp(ctx);
  }

  @Action(SyncServiceAPIAction.LocalChangeWasSynchronized)
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
    clearInterval(this._intervalId);
    this._intervalId = setInterval(() => {
      this.synchronizeApp(ctx);
    }, this.SYNC_PERIOD);
  }

  @Action(AuthAPIAction.UserLoggedOut)
  @Action(AppAction.UserNotAuthenticated)
  clearTimer(): void {
    clearInterval(this._intervalId);
  }

  private async synchronizeApp(ctx: StateContext<SyncStateModel>): Promise<void> {
    const syncApiCalls: Observable<void | Change[] | string>[] = [];
    if (!ctx.getState().clientId) {
      const clientId: string = await lastValueFrom(this.getClientIdAPICall(ctx));
      ctx.patchState({ clientId });
    }
    syncApiCalls.push(this.getChangesAPICall(ctx));
    syncApiCalls.push(this.sendChangesAPICalls(ctx));
    concat(...syncApiCalls)
      .pipe(
        tap({
          next: () => {
            ctx.patchState({ lastTime: new Date() });
          },
          error: err => this.syncErrorsHand(err, ctx),
        }),
      )
      .subscribe();
  }

  private getChangesAPICall(ctx: StateContext<SyncStateModel>): Observable<Change[]> {
    const state = ctx.getState();
    return this._serverChangesService.getChanges(state.clientId).pipe(
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

  private sendChangesAPICalls(ctx: StateContext<SyncStateModel>): Observable<void> {
    const state = ctx.getState();
    const apiCalls: Observable<void>[] = [];

    for (let i = 0; i < state.changes.length; i++) {
      apiCalls.push(
        this._clientChangesService.sendChanges(state.changes[i]).pipe(
          tap({
            next: () => {
              ctx.dispatch(new SyncServiceAPIAction.LocalChangeWasSynchronized(state.changes[i]));
            },
            error: error => {
              if (error.status === 404) {
                this.handleEntity404(ctx, i);
                return EMPTY;
              }
              if (error instanceof AppError) {
                ctx.dispatch(new SyncServiceAPIAction.LocalChangeWasSynchronized(state.changes[i]));
              }
              ctx.dispatch(SyncServiceAPIAction.LocalChangeSynchronizationFailed);
            },
          }),
        ),
      );
    }
    return concat(...apiCalls);
  }

  private getClientIdAPICall(ctx: StateContext<SyncStateModel>): Observable<string> {
    return this._clientIdSerivce.releaseClientId().pipe(
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

  private syncErrorsHand(err: Error, ctx) {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 400 && ESyncStateApiError.INVALID_CLIENT_ID) {
        this.getClientIdAPICall(ctx).subscribe();
      }
    }

    console.log(err);
    return EMPTY;
  }

  private handleEntity404(ctx: StateContext<SyncStateModel>, chnageIndex: number) {
    const state = ctx.getState();
    // The entity did not found on server
    // so we need to dispatch Delete Change action locally
    // to be synchronized with server
    const deleteChange: Change = {
      entity: state.changes[chnageIndex].entity,
      action: EChangeAction.Deleted,
      object: {
        id: state.changes[chnageIndex].object.id,
        modifiedAt: new Date().toISOString(),
      },
    };
    ctx.dispatch(new SyncServiceAPIAction.ServerChangesLoaded([deleteChange]));
    ctx.dispatch(new SyncServiceAPIAction.LocalChangeWasSynchronized(state.changes[chnageIndex]));

    // TICKET: https://brainas.atlassian.net/browse/BA-136
    // TODO: Notify user about error happened and task was deleted
  }
}
