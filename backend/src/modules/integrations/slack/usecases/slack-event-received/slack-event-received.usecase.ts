import { UseCase } from '../../../../../shared/core/UseCase.js';
import { Result } from '../../../../../shared/core/Result.js';
import { UseCaseError } from '../../../../../shared/core/use-case-error.js';
import {
  AppHomeOpenedSlackEvent,
  AppUninstalledSlackEvent,
  MemberLeftChannelSlackEvent,
  SlackEventReceivedReqestDTO,
} from './slack-event-received.dto';
import { ESlackEventType } from '../../enums/slack-event.enum.js';
import { SlackEventReceivedErrors } from './slack-event-recieved.errors.js';
import { SlackOAuthAccessRepo } from '../../../../../shared/repo/slack-oauth-access.repo.js';

export type SlackEventReceivedRequest = {
  dto: SlackEventReceivedReqestDTO;
};
export type SlackEventReceivedResponse = Result<void | UseCaseError>;

export class SlackEventReceivedUsecase
  implements
    UseCase<SlackEventReceivedRequest, Promise<SlackEventReceivedResponse>>
{
  private _slackOAuthAccessRepo: SlackOAuthAccessRepo;

  constructor(slackOAuthAccessRepo: SlackOAuthAccessRepo) {
    this._slackOAuthAccessRepo = slackOAuthAccessRepo;
  }

  public async execute(
    req: SlackEventReceivedRequest
  ): Promise<SlackEventReceivedResponse> {
    const eventType: ESlackEventType = req.dto.event.type;
    const teamId: string = req.dto.team_id;
    switch (eventType) {
      // Handel Slack Event 'app_uninstalled'
      case ESlackEventType.AppUninstalled:
        await this._slackOAuthAccessRepo.deletedSlackOAuthAccessByTeamId(
          teamId
        );
        console.log(`App Uninstalled for team with id=${teamId}!`);
        return Result.ok();

      // Handel Slack Event 'app_home_opened'
      case ESlackEventType.AppHomeOpened:
        const appHomeOpenedEvent: AppHomeOpenedSlackEvent = req.dto
          .event as AppHomeOpenedSlackEvent;

        const datetimeOfOpening: Date = new Date(
          parseInt(
            appHomeOpenedEvent.event_ts
              .toString()
              .split('.')
              .join('')
              .slice(0, -3)
          )
        );
        console.log(
          `User with id=${appHomeOpenedEvent.user} app opened home page at ${datetimeOfOpening}!`
        );
        return Result.ok();

      // Handel Slack Event 'member_left_channel'
      case ESlackEventType.MemberLeftChannel:
        const memberLeftChannelEvent: MemberLeftChannelSlackEvent = req.dto
          .event as MemberLeftChannelSlackEvent;
        console.log(
          `Member with id=${memberLeftChannelEvent.user} left channel with id=${memberLeftChannelEvent.channel}`
        );
        return Result.ok();

      default:
        return new SlackEventReceivedErrors.SlackEventTypeNotSupported(
          eventType
        );
    }
  }
}
