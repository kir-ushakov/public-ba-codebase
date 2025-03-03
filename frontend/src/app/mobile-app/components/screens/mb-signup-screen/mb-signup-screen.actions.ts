import { SignUpRequestDTO } from 'src/app/shared/services/api/auth.service';

export namespace MbSignupScreenAction {
  export class SignupUser {
    static readonly type = '[MbSignupScreenAction] Signup User';

    constructor(public dto: SignUpRequestDTO) {}
  }

  export class Closed {
    static readonly type = '[MbSignupScreenAction] Closed';
  }
}
