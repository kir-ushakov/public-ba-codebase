import { DomainError } from '../core/domain-error';
import { UniqueEntityID } from '../domain/UniqueEntityID';
import {
  CreateSlackOAuthAccessResult,
  ISlackOAuthAccessPresitant,
  SlackOAuthAccess,
} from '../domain/models/slack-oauth-access';

export class SlackOAuthAccessMapper {
  public static toDomain(
    raw: ISlackOAuthAccessPresitant
  ): SlackOAuthAccess | DomainError {
    const slackOAuthAccessOrError: CreateSlackOAuthAccessResult =
      SlackOAuthAccess.create(
        {
          userId: raw.userId,
          accessToken: raw.accessToken,
          authedUserId: raw.authedUserId,
          slackBotUserId: raw.slackBotUserId,
          teamId: raw.teamId,
        },
        new UniqueEntityID(raw._id)
      );

    slackOAuthAccessOrError.isFailure
      ? console.log(slackOAuthAccessOrError.error)
      : '';

    return slackOAuthAccessOrError.isSuccess
      ? slackOAuthAccessOrError.getValue()
      : null;
  }

  public static toPersistence(
    slackOAuthAccess: SlackOAuthAccess
  ): ISlackOAuthAccessPresitant {
    return {
      _id: slackOAuthAccess.id.toString(),
      userId: slackOAuthAccess.userId,
      accessToken: slackOAuthAccess.accessToken,
      authedUserId: slackOAuthAccess.authedUserId,
      slackBotUserId: slackOAuthAccess.slackBotUserId,
      teamId: slackOAuthAccess.teamId,
    };
  }
}
