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
}
