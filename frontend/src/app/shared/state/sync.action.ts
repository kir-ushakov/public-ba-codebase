import { Change } from '../models';
import { OutboxEntry } from '../models/outbox-entry.type';
import { LocalSnapshot } from '../services/infrastructure/local-store.service';

export namespace SyncAction {
  export class ChangeForSyncOccurred {
    static readonly type = '[Sync] Change For Sync Occurred';

    constructor(public entry: OutboxEntry) {}
  }

  export class ServerChangesLoaded {
    static readonly type = '[Sync] Changes Loaded';

    constructor(public changes: Change[]) {}
  }

  export class LocalChangeWasSynchronized {
    static readonly type = '[Sync] Local Change Was Synchronized';

    constructor(public entryId: string) {}
  }

  export class LocalDataHydrated {
    static readonly type = '[Sync] Local Data Hydrated';

    constructor(public snapshot: LocalSnapshot) {}
  }

  // TODO: Handle this case in UI - possible show icon 'sync problem'
  // TICKET: https://brainas.atlassian.net/browse/BA-245
  export class SyncinhriniziationWasFailed {
    static readonly type = '[Sync] Syncinhriniziation Was Failed';
  }

  export class Synchronize {
    static readonly type = '[Sync] Synchronize';
  }
}
