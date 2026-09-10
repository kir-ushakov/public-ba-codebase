import { Request, Response } from 'express';
import { OauthV2AccessResponse, WebClient } from '@slack/web-api';
import { Result } from '../../../../../shared/core/result.js';
import { UseCase } from '../../../../../shared/core/UseCase.js';
import { SlackOAuthAccessRepo } from '../../../../../shared/repo/slack-oauth-access.repo.js';
import {
  CreateSlackOAuthAccessResult,
  ISlackOAuthAccessProps,
  SlackOAuthAccess,
} from '../../../../../shared/domain/models/slack-oauth-access.js';
import { AddToSlackError } from './add-to-slack.errors.js';

export type AddToSlackRequest = {
  req: Request;
  res: Response;
  code: string;
  userId: string;
};
export type AddToSlackResponse = Result<void, AddToSlackError>;

export class AddToSlackUsecase implements UseCase<AddToSlackRequest, Promise<AddToSlackResponse>> {
  private _webClient: WebClient;
  private _slackOAuthAccessRepo: SlackOAuthAccessRepo;

  constructor(webClient: WebClient, slackOAuthAccessRepo: SlackOAuthAccessRepo) {
    this._webClient = webClient;
    this._slackOAuthAccessRepo = slackOAuthAccessRepo;
  }

  public async execute(req: AddToSlackRequest): Promise<AddToSlackResponse> {
    const response: OauthV2AccessResponse = await this._webClient.oauth.v2.access({
      client_id: process.env.SLACK_CLIENT_ID ?? '',
      client_secret: process.env.SLACK_CLIENT_SECRET ?? '',
      code: req.code,
      redirect_uri: 'https://brainas.net/integrations/slack/install',
    });

    const accessToken = response.access_token;
    const authedUserId = response.authed_user?.id;
    const slackBotUserId = response.bot_user_id;
    const teamId = response.team?.id;
    if (!accessToken || !authedUserId || !slackBotUserId || !teamId) {
      throw new Error('Incomplete Slack OAuth response');
    }

    const slackOAuthAccessProps: ISlackOAuthAccessProps = {
      userId: req.userId,
      accessToken,
      authedUserId,
      slackBotUserId,
      teamId,
    };

    const existsSlackOAuthAccess = await this._slackOAuthAccessRepo.getSlackOAuthAccessByUserId(
      slackOAuthAccessProps.userId,
    );

    if (existsSlackOAuthAccess) {
      await this._slackOAuthAccessRepo.deletedSlackOAuthAccessById(
        existsSlackOAuthAccess.id.toString(),
      );
    }
    const createSlackOAuthAccessResult: CreateSlackOAuthAccessResult =
      SlackOAuthAccess.create(slackOAuthAccessProps);

    const slackOAuthAccess: SlackOAuthAccess = createSlackOAuthAccessResult.getValue();

    await this._slackOAuthAccessRepo.create(slackOAuthAccess);

    return Result.ok<void, AddToSlackError>();
  }
}
