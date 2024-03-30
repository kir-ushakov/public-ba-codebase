import { User } from '../../models';

/**
 * #NOTE
 * API calls are sours of Actions
 * Essentially, every API service method must have two associated actions:
 * one for success and one for failure.
 * I store the API-related actions in the same folder next to the corresponding API service.
 */
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
