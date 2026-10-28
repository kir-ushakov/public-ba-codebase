import { Injectable } from '@angular/core';
import { Action, State, StateContext } from '@ngxs/store';
import { EChangeAction } from '@brainassistant/contracts';
import { AppAction } from './app.actions';
import { Change } from '../models/change.model';
import { append, patch, removeItem } from '@ngxs/store/operators';
import { ServerChangesService } from '../services/api/server-changes.service';
import { ServerSyncSignalService } from '../services/api/server-sync-signal.service';
import { lastValueFrom } from 'rxjs';
import { SyncAction } from './sync.action';
import { UserAction } from './user.actions';
import {
  MissingBlobDiscard,
  OutboundSyncService,
} from '../services/application/outbound-sync.service';
import { TasksAction } from './tasks.action';

export interface SyncStateModel {
  lastTime: Date | null;
  changes: Change[];
  syncedRevision: number;
}

@State<SyncStateModel>({
  name: 'sync',
  defaults: SyncState.defaults,
})
@Injectable()
export class SyncState {
  static readonly defaults: SyncStateModel = {
    lastTime: null,
    changes: [],
    syncedRevision: 0,
  };

  readonly SYNC_PERIOD = 1000 * 60;
  private intervalId: null | ReturnType<typeof setTimeout> = null;

  constructor(
    private readonly serverChangesService: ServerChangesService,
    private readonly outboundSyncService: OutboundSyncService,
    private readonly serverSyncSignal: ServerSyncSignalService,
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
  updateSyncTimer(ctx: StateContext<SyncStateModel>) {
    clearInterval(this.intervalId ?? undefined);
    this.serverSyncSignal.start();
    this.intervalId = setInterval(() => {
      ctx.dispatch(new SyncAction.Synchronize());
    }, this.SYNC_PERIOD);
    return ctx.dispatch(new SyncAction.Synchronize());
  }

  @Action(UserAction.LoggedOut)
  @Action(AppAction.UserNotAuthenticated)
  clearTimer(): void {
    clearInterval(this.intervalId ?? undefined);
    this.serverSyncSignal.stop();
  }

  @Action(SyncAction.Synchronize)
  async synchronize(ctx: StateContext<SyncStateModel>): Promise<void> {
    try {
      await this.fetchServerChanges(ctx);
      await this.syncPendingChanges(ctx);

      ctx.patchState({ lastTime: new Date() });
    } catch {
      ctx.dispatch(new SyncAction.SyncinhriniziationWasFailed());
    }
  }

  private async fetchServerChanges(ctx: StateContext<SyncStateModel>): Promise<void> {
    const afterRevision = ctx.getState().syncedRevision ?? 0;
    const page = await lastValueFrom(this.serverChangesService.fetch(afterRevision));
    await ctx.dispatch(new SyncAction.ServerChangesLoaded(page.changes));
    const current = ctx.getState().syncedRevision ?? 0;
    if (page.syncRevision > current) {
      ctx.patchState({ syncedRevision: page.syncRevision });
    }
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
