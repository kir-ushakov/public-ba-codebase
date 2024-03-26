import { User } from '../models/user.model';

export namespace UserAction {
  export class LogIn {
    static readonly type = '[Auth API] Log In';

    constructor(public email: string, public password: string) {}
  }

  export class LoggedIn {
    static readonly type = '[Auth API] Logged In';

    constructor(public userData: User) {}
  }

  export class LoggedOut {
    static readonly type = '[Auth API] Logged Out';
  }

  export class Relogin {
    static readonly type = '[Auth API] Relogin';

    constructor(public password: string) {}
  }

  export class AuthFailed {
    static readonly type = '[Auth API] Auth Failed';

    constructor(public message: string) {}
  }

  export class AddedToSlackStatusChanged {
    static readonly type = '[Integration API] Added To Slack Status Changed';

    constructor(public status: boolean) {}
  }
}
