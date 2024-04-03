export namespace MbLoginScreenAction {
  export class Opened {
    static readonly type = '[MbLoginScreen] Opened';
  }
  export class FieldValuesChanged {
    static readonly type = '[MbLoginScreen] Field Values Changed';
  }

  export class LoginUser {
    static readonly type = '[MbLoginScreen] Login User';

    constructor(public email: string, public password: string) {}
  }
}
