import { Change } from '../../models';

export namespace SyncServiceAPIAction {
  export class ServerChangesLoaded {
    static readonly type = '[Sync Service API] Changes Loaded';

    constructor(public changes: Change[]) {}
  }
  export class ServerChangesLoadingFailed {
    static readonly type = '[Sync Service API] Changes Loading Failed';
  }

  export class LocalChangeWasSynchronized {
    static readonly type = '[Sync Service API] Local Change Was Synchronized';

    constructor(public change: Change) {}
  }
}
