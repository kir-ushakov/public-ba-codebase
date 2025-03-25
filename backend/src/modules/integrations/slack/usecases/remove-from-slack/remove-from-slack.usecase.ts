import { WebClient } from '@slack/web-api';
import { Result } from '../../../../../shared/core/Result.js';
import { UseCase } from '../../../../../shared/core/UseCase.js';
import { UseCaseError } from '../../../../../shared/core/use-case-error.js';
import { SlackOAuthAccessRepo } from '../../../../../shared/repo/slack-oauth-access.repo.js';
import { SlackOAuthAccess } from '../../../../../shared/domain/models/slack-oauth-access.js';
import { RemoveFromSlackErrors } from './remove-from-slack.errors.js';

export type RemoveFromSlackRequest = { userId: string };
export type RemoveFromSlackResponse = Result<void | UseCaseError>;

export class RemoveFromSlackUsecase
  implements UseCase<RemoveFromSlackRequest, Promise<RemoveFromSlackResponse>>
{
  private _webClient: WebClient;
  private _slackOAuthAccessRepo: SlackOAuthAccessRepo;

  constructor(
    webClient: WebClient,
    slackOAuthAccessRepo: SlackOAuthAccessRepo
  ) {
    this._webClient = webClient;
    this._slackOAuthAccessRepo = slackOAuthAccessRepo;
  }
  public async execute(
    req: RemoveFromSlackRequest
  ): Promise<RemoveFromSlackResponse> {
    const userId = req.userId;
    const slackOAuthAccess: SlackOAuthAccess =
      await this._slackOAuthAccessRepo.getSlackOAuthAccessByUserId(userId);

    if (!slackOAuthAccess) {
      return new RemoveFromSlackErrors.SlackOAuthAccessNotFound();
    }

    const accessToken = slackOAuthAccess.accessToken;
    await this._webClient.auth.revoke({
      client_id: process.env.SLACK_CLIENT_ID,
      client_secret: process.env.SLACK_CLIENT_SECRET,
      token: accessToken,
    });

    await this._slackOAuthAccessRepo.deletedSlackOAuthAccessByTeamId(
      slackOAuthAccess.teamId
    );

    return Result.ok();
  }
}
