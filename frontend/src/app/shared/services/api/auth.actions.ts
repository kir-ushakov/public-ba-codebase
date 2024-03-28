import { User } from '../../models';

export namespace AuthAPIAction {
  export class LoggedIn {
    static readonly type = '[Auth API] Logged In';

    constructor(public userData: User) {}
  }

  export class LoggedOut {
    static readonly type = '[Auth API] Logged Out';
  }

  export class AuthFailed {
    static readonly type = '[Auth API] Auth Failed';

    constructor(public message: string) {}
  }
}
