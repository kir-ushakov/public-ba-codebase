import { ERefreshSessionUseCaseError } from '@brainassistant/contracts';
import { Result } from '../../../../shared/core/result.js';
import { UseCaseError } from '../../../../shared/core/use-case-error.js';
import { EHttpStatus } from '../../../../shared/infra/http/models/base-controller.js';

export { ERefreshSessionUseCaseError };

export const RefreshSessionErrors = {
  Invalid: (): Result<never, UseCaseError<ERefreshSessionUseCaseError>> =>
    Result.fail(
      new UseCaseError<ERefreshSessionUseCaseError>(
        ERefreshSessionUseCaseError.Invalid,
        'Refresh session is invalid',
        EHttpStatus.Unauthorized,
      ),
    ),
};
