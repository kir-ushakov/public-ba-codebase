import { ERemoveFromSlackUseCaseError } from '@brainassistant/contracts';
import { Result } from '../../../../../shared/core/result.js';
import { UseCaseError } from '../../../../../shared/core/use-case-error.js';
import { EHttpStatus } from '../../../../../shared/infra/http/models/base-controller.js';

export { ERemoveFromSlackUseCaseError };

export const RemoveFromSlackErrors = {
  SlackOAuthAccessNotFound: (): Result<never, UseCaseError<ERemoveFromSlackUseCaseError>> =>
    Result.fail(
      new UseCaseError<ERemoveFromSlackUseCaseError>(
        ERemoveFromSlackUseCaseError.SlackOAuthAccessNotFound,
        'Slack OAuth Access Token Not Found',
        EHttpStatus.NotFound,
      ),
    ),
};
