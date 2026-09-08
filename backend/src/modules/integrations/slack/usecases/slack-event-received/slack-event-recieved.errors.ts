import { ESlackEventReceivedUseCaseError } from '@brainassistant/contracts';
import { Result } from '../../../../../shared/core/result.js';
import { UseCaseError } from '../../../../../shared/core/use-case-error.js';
import { EHttpStatus } from '../../../../../shared/infra/http/models/base-controller.js';

export { ESlackEventReceivedUseCaseError };

export const SlackEventReceivedErrors = {
  SlackEventTypeNotSupported: (
    eventType: string,
  ): Result<never, UseCaseError<ESlackEventReceivedUseCaseError>> =>
    Result.fail(
      new UseCaseError<ESlackEventReceivedUseCaseError>(
        ESlackEventReceivedUseCaseError.SlackEventTypeNotSupported,
        `Slack Event Type ${eventType} Is Not Supported`,
        EHttpStatus.BadRequest,
      ),
    ),
};
