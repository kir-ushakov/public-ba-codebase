export namespace MbSyncScreenAction {
  export class Relogin {
    static readonly type = '[MbSyncScreen] Relogin User';

    constructor(public password: string) {}
  }
}
