import { Result } from '../../../../../shared/core/result.js';
import { UseCaseError } from '../../../../../shared/core/use-case-error.js';
import { EHttpStatus } from '../../../../../shared/infra/http/models/base-controller.js';

export enum RemoveFromSlackErrorCode {
  SlackOAuthAccessNotFound = 'REMOVE_FROM_SLACK_ERROR_CODE__SLACK_OAUTH_ACCESS_NOT_FOUND',
}

export const RemoveFromSlackErrors = {
  SlackOAuthAccessNotFound: (): Result<never, UseCaseError<RemoveFromSlackErrorCode>> =>
    Result.fail(
      new UseCaseError<RemoveFromSlackErrorCode>(
        RemoveFromSlackErrorCode.SlackOAuthAccessNotFound,
        'Slack OAuth Access Token Not Found',
        EHttpStatus.NotFound,
      ),
    ),
};
