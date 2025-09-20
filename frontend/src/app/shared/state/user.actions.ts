import { User } from '../models';

export namespace UserAction {
  export class UserLoggedInWithPassword {
    static readonly type = '[User] User Logged In With Password';

    constructor(public userData: User) {}
  }

  export class UserAuthenticatedWithGoogle {
    static readonly type = '[User] User Authenticated With Google';

    constructor(public userData: User) {}
  }

  export class AuthFailed {
    static readonly type = '[User] Auth Failed';

    constructor(public message: string) {}
  }

  export class LoggedOut {
    static readonly type = '[User] Logged Out';
  }

  export class LogoutFailed {
    static readonly type = '[User] User Loggout Failed';

    constructor(public userData: User) {}
  }
}
