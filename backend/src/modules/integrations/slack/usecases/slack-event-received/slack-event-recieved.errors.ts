import { Result } from '../../../../../shared/core/Result.js';
import { UseCaseError } from '../../../../../shared/core/use-case-error.js';
import { EHttpStatus } from '../../../../../shared/infra/http/models/base-controller.js';

export class SlackEventReceivedError extends UseCaseError<SlackEventReceivedErrorCodes> {}

enum SlackEventReceivedErrorCode {
  SlackEventTypeNotSupported = 'SLACK_EVENT_TYPE_NOT_SUPPORTED',
  SlackOAuthAccessNotFound = 'SLACK_OAUTH_ACCESS_NOT_FOUND',
}

type SlackEventReceivedErrorCodes = SlackEventReceivedErrorCode;

export namespace SlackEventReceivedErrors {
  export class SlackEventTypeNotSupported extends Result<never, SlackEventReceivedError> {
    constructor(eventType: string) {
      super(
        false,
        new SlackEventReceivedError(
          SlackEventReceivedErrorCode.SlackEventTypeNotSupported,
          `Slack Event Type ${eventType} Is Not Supported`,
          EHttpStatus.BadRequest,
        ),
      );
    }
  }
}
