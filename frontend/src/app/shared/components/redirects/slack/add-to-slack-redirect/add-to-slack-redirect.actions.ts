export namespace AddToSlackRedirectScreenAction {
  export class Opened {
    static readonly type = '[AddToSlackRedirectScreen] Opened';

    constructor(public readonly code: string) { }
  }
}
