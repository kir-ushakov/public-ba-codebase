export namespace LoginScreenAction {
  export class Opened {
    static readonly type = '[LoginScreen] Opened';
  }
  export class FieldValuesChanged {
    static readonly type = '[LoginScreen] Field Values Changed';
  }

  export class LoginUser {
    static readonly type = '[LoginScreen] Login User';

    constructor(
      public email: string,
      public password: string,
    ) {}
  }
}
