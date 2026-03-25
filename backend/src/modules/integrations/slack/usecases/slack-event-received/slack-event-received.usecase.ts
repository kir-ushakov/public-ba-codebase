import { UseCase } from '../../../../../shared/core/UseCase.js';
import { Result } from '../../../../../shared/core/result.js';
import {
  AppHomeOpenedSlackEvent,
  MemberLeftChannelSlackEvent,
  SlackEventReceivedReqestDTO,
} from './slack-event-received.dto.js';
import { ESlackEventType } from '../../enums/slack-event.enum.js';
import {
  SlackEventReceivedError,
  SlackEventReceivedErrors,
} from './slack-event-recieved.errors.js';
import { SlackOAuthAccessRepo } from '../../../../../shared/repo/slack-oauth-access.repo.js';

export type SlackEventReceivedResponse = Result<void | never, SlackEventReceivedError>;

export type SlackEventReceivedParams = SlackEventReceivedReqestDTO;

export class SlackEventReceivedUsecase
  implements UseCase<SlackEventReceivedParams, Promise<SlackEventReceivedResponse>>
{
  private _slackOAuthAccessRepo: SlackOAuthAccessRepo;

  constructor(slackOAuthAccessRepo: SlackOAuthAccessRepo) {
    this._slackOAuthAccessRepo = slackOAuthAccessRepo;
  }

  public async execute(params: SlackEventReceivedParams): Promise<SlackEventReceivedResponse> {
    const eventType: ESlackEventType = params.event.type;
    const teamId: string = params.team_id;
    switch (eventType) {
      // Handel Slack Event 'app_uninstalled'
      case ESlackEventType.AppUninstalled:
        await this._slackOAuthAccessRepo.deletedSlackOAuthAccessByTeamId(teamId);
        console.log(`App Uninstalled for team with id=${teamId}!`);
        return Result.ok();

      // Handel Slack Event 'app_home_opened'
      case ESlackEventType.AppHomeOpened:
        const appHomeOpenedEvent: AppHomeOpenedSlackEvent = params
          .event as AppHomeOpenedSlackEvent;

        const datetimeOfOpening: Date = new Date(
          parseInt(appHomeOpenedEvent.event_ts.toString().split('.').join('').slice(0, -3)),
        );
        console.log(
          `User with id=${appHomeOpenedEvent.user} app opened home page at ${datetimeOfOpening}!`,
        );
        return Result.ok();

      // Handel Slack Event 'member_left_channel'
      case ESlackEventType.MemberLeftChannel:
        const memberLeftChannelEvent: MemberLeftChannelSlackEvent = params
          .event as MemberLeftChannelSlackEvent;
        console.log(
          `Member with id=${memberLeftChannelEvent.user} left channel with id=${memberLeftChannelEvent.channel}`,
        );
        return Result.ok();

      default:
        return new SlackEventReceivedErrors.SlackEventTypeNotSupported(eventType);
    }
  }
}
