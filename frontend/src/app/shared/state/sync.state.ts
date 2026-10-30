import { Injectable } from '@angular/core';
import { Action, State, StateContext } from '@ngxs/store';
import { EChangeAction } from '@brainassistant/contracts';
import { AppAction } from './app.actions';
import { Change } from '../models/change.model';
import { OutboxEntry } from '../models/outbox-entry.type';
import { append, patch, removeItem } from '@ngxs/store/operators';
import { ServerChangesService } from '../services/api/server-changes.service';
import { lastValueFrom } from 'rxjs';
import { SyncAction } from './sync.action';
import { UserAction } from './user.actions';
import {
  MissingBlobDiscard,
  OutboundSyncService,
} from '../services/application/outbound-sync.service';
import { LocalStore } from '../services/infrastructure/local-store.service';
import { TasksAction } from './tasks.action';

export interface SyncStateModel {
  lastTime: Date | null;
  /** In-memory projection of the IndexedDB outbox. IndexedDB is the source of truth. */
  outbox: OutboxEntry[];
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
    outbox: [],
    syncedRevision: 0,
  };

  readonly SYNC_PERIOD = 1000 * 20; // sync interval 20 sec;
  private intervalId: null | ReturnType<typeof setTimeout> = null;

  constructor(
    private readonly serverChangesService: ServerChangesService,
    private readonly outboundSyncService: OutboundSyncService,
    private readonly localStore: LocalStore,
  ) {}

  @Action(SyncAction.ChangeForSyncOccurred)
  changeOccurred(
    ctx: StateContext<SyncStateModel>,
    { entry }: SyncAction.ChangeForSyncOccurred,
  ): void {
    ctx.setState(
      patch({
        outbox: append([entry]),
      }),
    );

    ctx.dispatch(new SyncAction.Synchronize());
  }

  @Action(SyncAction.LocalChangeWasSynchronized)
  clientChangesSynchronized(
    ctx: StateContext<SyncStateModel>,
    { entryId }: SyncAction.LocalChangeWasSynchronized,
  ): void {
    ctx.setState(
      patch({
        outbox: removeItem<OutboxEntry>(entry => entry.id === entryId),
      }),
    );
  }

  @Action(SyncAction.LocalDataHydrated)
  hydrate(ctx: StateContext<SyncStateModel>, { snapshot }: SyncAction.LocalDataHydrated): void {
    ctx.patchState({
      outbox: snapshot.outbox,
      syncedRevision: snapshot.syncedRevision,
    });
  }

  @Action(AppAction.Opened)
  updateSyncTimer(ctx: StateContext<SyncStateModel>) {
    clearInterval(this.intervalId ?? undefined);
    this.intervalId = setInterval(() => {
      ctx.dispatch(new SyncAction.Synchronize());
    }, this.SYNC_PERIOD);
    return ctx.dispatch(new SyncAction.Synchronize());
  }

  @Action(AppAction.UserNotAuthenticated)
  clearTimer(): void {
    clearInterval(this.intervalId ?? undefined);
    this.intervalId = null;
  }

  @Action(UserAction.LoggedOut)
  loggedOut(ctx: StateContext<SyncStateModel>): void {
    this.clearTimer();
    ctx.setState(SyncState.defaults);
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
    const applied = await this.localStore.applyServerChangesAndRevision(
      page.changes,
      page.syncRevision,
    );
    await ctx.dispatch(new SyncAction.ServerChangesLoaded(applied));
    const current = ctx.getState().syncedRevision ?? 0;
    if (page.syncRevision > current) {
      ctx.patchState({ syncedRevision: page.syncRevision });
    }
  }

  private async syncPendingChanges(ctx: StateContext<SyncStateModel>): Promise<void> {
    const queued = await this.localStore.listOutbox();
    ctx.patchState({ outbox: queued });
    const result = await this.outboundSyncService.process(queued.map(entry => entry.change));

    for (const change of result.sent) {
      const entry = queued.find(item => item.change === change);
      if (!entry) {
        continue;
      }
      await this.localStore.removeOutboxEntry(entry.id);
      await ctx.dispatch(new SyncAction.LocalChangeWasSynchronized(entry.id));
    }
    for (const change of result.notFound) {
      const entry = queued.find(item => item.change === change);
      if (!entry) {
        continue;
      }
      await this.handleEntityNotFoundError(ctx, entry);
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
      await this.dropQueuedChangesForEntity(ctx, discard.taskId);
      await ctx.dispatch(new TasksAction.DeleteTask(discard.taskId));
      ctx.dispatch(new AppAction.ShowErrorInUI('The task photo is missing. The task was removed.'));
    }
  }

  private async dropQueuedChangesForEntity(
    ctx: StateContext<SyncStateModel>,
    entityId: string,
  ): Promise<void> {
    const ids = ctx
      .getState()
      .outbox.filter(entry => entry.entityId === entityId)
      .map(entry => entry.id);
    ctx.patchState({
      outbox: ctx.getState().outbox.filter(entry => entry.entityId !== entityId),
    });
    await this.localStore.removeOutboxEntries(ids);
  }

  private async handleEntityNotFoundError(
    ctx: StateContext<SyncStateModel>,
    entry: OutboxEntry,
  ): Promise<void> {
    if (!entry.change.object) {
      throw new Error('Cannot handle entity-not-found without change.object');
    }
    const deleteChange: Change = {
      entity: entry.change.entity,
      action: EChangeAction.Deleted,
      object: {
        id: entry.change.object.id,
        modifiedAt: new Date().toISOString(),
      },
    };
    await this.localStore.removeLocalEntity(entry.change.entity, entry.entityId);
    await this.localStore.removeOutboxEntry(entry.id);
    await ctx.dispatch(new SyncAction.ServerChangesLoaded([deleteChange]));
    await ctx.dispatch(new SyncAction.LocalChangeWasSynchronized(entry.id));

    // TODO: Notify user that entity was deleted on server
    // TICKET: https://brainas.atlassian.net/browse/BA-136
  }
}
