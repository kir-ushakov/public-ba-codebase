import { Injectable } from '@angular/core';
import { Action, State, StateContext } from '@ngxs/store';
import { EChangeAction } from '@brainassistant/contracts';
import { ClientIdService } from 'src/app/shared/services/api/client-id.service';
import { AppAction } from './app.actions';
import { HttpErrorResponse } from '@angular/common/http';
import { Change } from '../models/change.model';
import { append, patch, removeItem } from '@ngxs/store/operators';
import { ServerChangesService } from '../services/api/server-changes.service';
import { Observable, lastValueFrom, tap } from 'rxjs';
import { SyncAction } from './sync.action';
import { UserAction } from './user.actions';
import {
  MissingBlobDiscard,
  OutboundSyncService,
} from '../services/application/outbound-sync.service';
import { TasksAction } from './tasks.action';

export interface SyncStateModel {
  clientId: string | null;
  lastTime: Date | null;
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
    private readonly serverChangesService: ServerChangesService,
    private readonly outboundSyncService: OutboundSyncService,
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
    clearInterval(this.intervalId ?? undefined);
    this.intervalId = setInterval(() => {
      ctx.dispatch(new SyncAction.Synchronize());
    }, this.SYNC_PERIOD);
  }

  @Action(UserAction.LoggedOut)
  @Action(AppAction.UserNotAuthenticated)
  clearTimer(): void {
    clearInterval(this.intervalId ?? undefined);
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
    } catch (err) {
      // TODO: Don't rely only on HTTP status code - check error name from backend response
      // TICKET: https://brainas.atlassian.net/browse/BA-258
      if (err instanceof HttpErrorResponse && err.status === 404) {
        this.handleClientIdNotFoundError(ctx);
      } else {
        ctx.dispatch(new SyncAction.SyncinhriniziationWasFailed());
      }
    }
  }

  private async fetchServerChanges(ctx: StateContext<SyncStateModel>): Promise<void> {
    const clientId = ctx.getState().clientId;
    if (!clientId) {
      return;
    }
    const changes = await lastValueFrom(this.serverChangesService.fetch(clientId));
    await ctx.dispatch(new SyncAction.ServerChangesLoaded(changes));
  }

  private async syncPendingChanges(ctx: StateContext<SyncStateModel>): Promise<void> {
    const result = await this.outboundSyncService.process(ctx.getState().changes);

    for (const change of result.sent) {
      await ctx.dispatch(new SyncAction.LocalChangeWasSynchronized(change));
    }
    for (const change of result.notFound) {
      await this.handleEntityNotFoundError(ctx, change);
    }
    await this.discardTasksWithMissingBlobs(ctx, result.missingBlobDiscards);
    if (result.sendFailed) {
      ctx.dispatch(new SyncAction.SyncinhriniziationWasFailed());
    }
  }

  private async discardTasksWithMissingBlobs(
    ctx: StateContext<SyncStateModel>,
    discards: MissingBlobDiscard[],
  ): Promise<void> {
    for (const discard of discards) {
      this.dropQueuedChangesForEntity(ctx, discard.taskId);
      ctx.dispatch(new AppAction.ShowErrorInUI('The task photo is missing. The task was removed.'));
      await ctx.dispatch(new TasksAction.DeleteTask(discard.taskId));
    }
  }

  private dropQueuedChangesForEntity(ctx: StateContext<SyncStateModel>, entityId: string): void {
    ctx.patchState({
      changes: ctx.getState().changes.filter(change => change.object?.id !== entityId),
    });
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
      lastTime: null,
    });
    ctx.dispatch(new SyncAction.Synchronize());
  }

  private async handleEntityNotFoundError(
    ctx: StateContext<SyncStateModel>,
    change: Change,
  ): Promise<void> {
    if (!change.object) {
      throw new Error('Cannot handle entity-not-found without change.object');
    }
    const deleteChange: Change = {
      entity: change.entity,
      action: EChangeAction.Deleted,
      object: {
        id: change.object.id,
        modifiedAt: new Date().toISOString(),
      },
    };
    await ctx.dispatch(new SyncAction.ServerChangesLoaded([deleteChange]));
    await ctx.dispatch(new SyncAction.LocalChangeWasSynchronized(change));

    // TODO: Notify user that entity was deleted on server
    // TICKET: https://brainas.atlassian.net/browse/BA-136
  }
}
