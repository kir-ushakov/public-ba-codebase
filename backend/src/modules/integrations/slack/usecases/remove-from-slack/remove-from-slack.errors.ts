import { Result } from '../../../../../shared/core/Result.js';
import { UseCaseError } from '../../../../../shared/core/use-case-error.js';
import { EHttpStatus } from '../../../../../shared/infra/http/models/base-controller.js';

export class RemoveFromSlackError extends UseCaseError<RemoveFromSlackErrorCodes> {}

enum RemoveFromSlackErrorCode {
  SlackOAuthAccessNotFound = 'REMOVE_FROM_SLACK_ERROR_CODE__SLACK_OAUTH_ACCESS_NOT_FOUND',
}

type RemoveFromSlackErrorCodes = RemoveFromSlackErrorCode;

export namespace RemoveFromSlackErrors {
  export class SlackOAuthAccessNotFound extends Result<never, RemoveFromSlackError> {
    constructor() {
      super(
        false,
        new RemoveFromSlackError(
          RemoveFromSlackErrorCode.SlackOAuthAccessNotFound,
          'Slack OAuth Access Token Not Found',
          EHttpStatus.NotFound,
        ),
      );
    }
  }
}
