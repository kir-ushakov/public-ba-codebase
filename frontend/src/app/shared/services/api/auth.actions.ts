import { User } from '../../models';

export namespace AuthAPIAction {
  export class UserLoggedIn {
    static readonly type = '[Auth API] Uer Logged In';

    constructor(public userData: User) {}
  }

  export class UserAuthFailed {
    static readonly type = '[Auth API] User Auth Failed';

    constructor(public message: string) {}
  }

  export class UserLoggedOut {
    static readonly type = '[Auth API] User Logged Out';
  }

  export class UserLogoutFailed {
    static readonly type = '[Auth API] User Loggout Failed';

    constructor(public userData: User) {}
  }
}
