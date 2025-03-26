import { AggregateRoot } from '../AggregateRoot.js';
import { Result } from '../../core/Result.js';
import { UniqueEntityID } from '../UniqueEntityID.js';

export interface ISlackOAuthAccessProps {
  userId: string;
  accessToken: string;
  authedUserId: string;
  slackBotUserId: string;
  teamId: string;
}

export interface ISlackOAuthAccessPresitant extends ISlackOAuthAccessProps {
  _id?: string;
}

export type CreateSlackOAuthAccessResult = Result<SlackOAuthAccess>;

export class SlackOAuthAccess extends AggregateRoot<ISlackOAuthAccessProps> {
  get id(): UniqueEntityID {
    return this._id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get accessToken(): string {
    return this.props.accessToken;
  }

  get authedUserId(): string {
    return this.props.authedUserId;
  }

  get slackBotUserId(): string {
    return this.props.slackBotUserId;
  }

  get teamId(): string {
    return this.props.teamId;
  }

  public static create(
    props: ISlackOAuthAccessProps,
    id?: UniqueEntityID
  ): CreateSlackOAuthAccessResult {
    const slackOAuthAccess = new SlackOAuthAccess(props, id);

    return Result.ok<SlackOAuthAccess>(slackOAuthAccess);
  }

  private constructor(props: ISlackOAuthAccessProps, id?: UniqueEntityID) {
    super(props, id);
  }
}
