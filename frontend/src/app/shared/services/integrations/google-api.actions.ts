import { User } from '../../models';

export namespace GoogleAPIAction {
  export class UserAuthenticated {
    static readonly type = '[Google API Action] User Authenticated';

    constructor(public userData: User) {}
  }
}
