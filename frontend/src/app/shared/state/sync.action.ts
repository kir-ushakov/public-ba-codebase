import { Change } from '../models';

export namespace SyncAction {
  export class LocalChangeWasCanceled {
    static readonly type = '[Sync] Local Change Was sCanceled';

    constructor(public change: Change) {}
  }
}
