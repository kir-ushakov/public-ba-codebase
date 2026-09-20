export namespace SyncScreenAction {
  export class Relogin {
    static readonly type = '[SyncScreen] Relogin User';

    constructor(public password: string) {}
  }
}
