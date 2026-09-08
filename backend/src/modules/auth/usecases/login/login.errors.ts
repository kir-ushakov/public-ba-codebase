import { ELoginUseCaseError } from '@brainassistant/contracts';
import { Result } from '../../../../shared/core/result.js';
import { UseCaseError } from '../../../../shared/core/use-case-error.js';
import { EHttpStatus } from '../../../../shared/infra/http/models/base-controller.js';

export { ELoginUseCaseError };

export const LoginErrors = {
  LoginFailed: (): Result<never, UseCaseError<ELoginUseCaseError>> =>
    Result.fail(
      new UseCaseError<ELoginUseCaseError>(
        ELoginUseCaseError.LoginFailed,
        'Authorization failed!',
        EHttpStatus.BadRequest,
      ),
    ),
  UserAccountNotVerified: (): Result<never, UseCaseError<ELoginUseCaseError>> =>
    Result.fail(
      new UseCaseError<ELoginUseCaseError>(
        ELoginUseCaseError.UserAccountNotVerified,
        'User account not verified!',
        EHttpStatus.BadRequest,
      ),
    ),
};
