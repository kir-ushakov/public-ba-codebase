import { Result } from '../../../../../shared/core/result.js';
import { UseCaseError } from '../../../../../shared/core/use-case-error.js';
import { EHttpStatus } from '../../../../../shared/infra/http/models/base-controller.js';

export enum SlackEventReceivedErrorCode {
  SlackEventTypeNotSupported = 'SLACK_EVENT_TYPE_NOT_SUPPORTED',
  SlackOAuthAccessNotFound = 'SLACK_OAUTH_ACCESS_NOT_FOUND',
}

export const SlackEventReceivedErrors = {
  SlackEventTypeNotSupported: (
    eventType: string,
  ): Result<never, UseCaseError<SlackEventReceivedErrorCode>> =>
    Result.fail(
      new UseCaseError<SlackEventReceivedErrorCode>(
        SlackEventReceivedErrorCode.SlackEventTypeNotSupported,
        `Slack Event Type ${eventType} Is Not Supported`,
        EHttpStatus.BadRequest,
      ),
    ),
};
