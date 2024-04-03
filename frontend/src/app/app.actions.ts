import { Change } from './shared/models';

export namespace AppAction {
  export class Opened {
    static readonly type = '[App] Opened';
  }

  export class Online {
    static readonly type = '[App] Is Online';
  }

  export class Offline {
    static readonly type = '[App] Is Offline';
  }

  export class NavigateToHomeScreen {
    static readonly type = '[App] Navigate To Home Screen';
  }

  export class NavigateToProfileScreen {
    static readonly type = '[App] Navigate To Profile Screen';
  }

  export class NavigateToLoginScreen {
    static readonly type = '[App] Navigate To Login Screen';
  }

  export class NavigateToSingUpScreen {
    static readonly type = '[App] Navigate To SingUp Screen';
  }

  export class UserNotAuthenticated {
    static readonly type = '[App API] User Not Authenticated';
  }

  export class ChangeForSyncOccurred {
    static readonly type = '[App] Change Occurred';

    constructor(public change: Change) {}
  }
}
