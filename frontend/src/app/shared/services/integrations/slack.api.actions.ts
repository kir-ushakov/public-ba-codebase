export namespace SlackAPIAction {
  export class AddedToSlack {
    static readonly type = '[Slack API Action] Added To Slack';
  }

  export class RemovedFromSlack {
    static readonly type = '[Slack API Action] Removed From Slack';
  }
}
