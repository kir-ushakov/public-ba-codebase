import { SignUpRequestDTO } from 'src/app/shared/services/api/auth.service';

export namespace SignupScreenAction {
  export class SignupUser {
    static readonly type = '[SignupScreenAction] Signup User';

    constructor(public dto: SignUpRequestDTO) {}
  }

  export class Closed {
    static readonly type = '[SignupScreenAction] Closed';
  }
}
