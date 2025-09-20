import { Change } from '../models';

export namespace SyncAction {
  export class ChangeForSyncOccurred {
    static readonly type = '[Sync] Change For Sync Occurred';

    constructor(public change: Change) {}
  }
  export class LocalChangeWasCanceled {
    static readonly type = '[Sync] Local Change Was Canceled';

    constructor(public change: Change) {}
  }

  export class ServerChangesLoaded {
    static readonly type = '[Sync] Changes Loaded';

    constructor(public changes: Change[]) {}
  }

  export class LocalChangeWasSynchronized {
    static readonly type = '[Sync] Local Change Was Synchronized';

    constructor(public change: Change) {}
  }

  // TODO: Handle this case in UI - possible show icon 'sync problem'
  // TICKET: https://brainas.atlassian.net/browse/BA-245
  export class SyncinhriniziationWasFailed {
    static readonly type = '[Sync] Syncinhriniziation Was Failed';
  }
}
