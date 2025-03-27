import {
  ConversationsListResponse,
  ConversationsMembersResponse,
  ConversationsCreateResponse,
  WebClient,
} from '@slack/web-api';
import { Channel } from '@slack/web-api/dist/response/ConversationsListResponse.js';
import { SlackOAuthAccessRepo } from '../../../repo/slack-oauth-access.repo.js';
import { SlackOAuthAccess } from '../../../domain/models/slack-oauth-access.js';

export class SlackService {
  readonly CHANNEL_NAME = 'brainasapp';
  private _slackOAuthAccessRepo: SlackOAuthAccessRepo;
  private _webClient: WebClient;
  private _slackAuthedUserId: string;

  constructor(slackOAuthAccessRepo: SlackOAuthAccessRepo) {
    this._slackOAuthAccessRepo = slackOAuthAccessRepo;
  }

  public async sendMessage(msg: string, userId: string) {
    try {
      // need to initialize Slack API Web Client
      await this.initWebClient(userId);

      // need to create a 'brainasapp' channel in the user's workspace, if we haven't done yet
      const channelId = await this.createChannelIfNotExist();

      // need to add user in 'brainasapp' channel, if we haven't done yet
      await this.addUserIfNotInChannel(channelId);

      // post message
      await this._webClient.chat.postMessage({
        channel: this.CHANNEL_NAME,
        text: msg,
      });
    } catch (error) {
      console.log(error);
    }
  }

  private async initWebClient(userId: string): Promise<void> {
    // getting access token from DB
    const slackOAuthAccess: SlackOAuthAccess =
      await this._slackOAuthAccessRepo.getSlackOAuthAccessByUserId(userId);
    const slackAccessToken = slackOAuthAccess.accessToken;
    this._slackAuthedUserId = slackOAuthAccess.authedUserId;

    // initializing Slack API Web Client with access token
    const webClient = new WebClient(slackAccessToken);
    this._webClient = webClient;
  }

  private async createChannelIfNotExist(): Promise<string> {
    let channel: Channel;

    // trying to find a channel with 'brainasapp' name
    const result: ConversationsListResponse =
      await this._webClient.conversations.list();
    channel = result.channels.find((c) => c.name === this.CHANNEL_NAME);
    if (!channel) {
      // if not found - create it
      const createChannelResp: ConversationsCreateResponse =
        await this._webClient.conversations.create({
          name: this.CHANNEL_NAME,
        });
      channel = createChannelResp.channel;
    } else if (!channel.is_member) {
      // if channel exists but app bot not a member - need to join
      await this._webClient.conversations.join({
        channel: channel.id,
      });
    }

    return channel.id;
  }

  private async addUserIfNotInChannel(channelId: string): Promise<void> {
    // Make sure the user is a member of the channel
    const membersResp: ConversationsMembersResponse =
      await this._webClient.conversations.members({ channel: channelId });
    const isMemberOfChannel = membersResp.members.includes(
      this._slackAuthedUserId
    );

    // and add if not.
    if (!isMemberOfChannel) {
      await this._webClient.conversations.invite({
        channel: channelId,
        users: this._slackAuthedUserId,
      });
    }
  }
}
