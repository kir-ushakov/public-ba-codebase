import { ESignUpUseCaseError } from '@brainassistant/contracts';
import { Result } from '../../../../shared/core/result.js';
import { UseCaseError } from '../../../../shared/core/use-case-error.js';
import { EHttpStatus } from '../../../../shared/infra/http/models/base-controller.js';

export { ESignUpUseCaseError };

export const SignUpErrors = {
  EmailAlreadyInUse: (email: string): Result<never, UseCaseError<ESignUpUseCaseError>> =>
    Result.fail(
      new UseCaseError<ESignUpUseCaseError>(
        ESignUpUseCaseError.EmailAlreadyInUse,
        `The email ${email} already exists`,
        EHttpStatus.Conflict,
      ),
    ),
  EmailInvalid: (email: string): Result<never, UseCaseError<ESignUpUseCaseError>> =>
    Result.fail(
      new UseCaseError<ESignUpUseCaseError>(
        ESignUpUseCaseError.EmailInvalid,
        `The email ${email} is invalid`,
        EHttpStatus.BadRequest,
      ),
    ),
};
