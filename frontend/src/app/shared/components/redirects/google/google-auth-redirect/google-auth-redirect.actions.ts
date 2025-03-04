export namespace GoogleAuthRedirectScreenAction {
  export class Opened {
    static readonly type = '[LoginWithGoogleRedirectScreen] Opened';

    constructor(public readonly code: string) { }
  }
}
