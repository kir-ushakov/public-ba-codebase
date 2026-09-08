import { Result } from '../../../../shared/core/result.js';
import { UseCaseError } from '../../../../shared/core/use-case-error.js';
import { EHttpStatus } from '../../../../shared/infra/http/models/base-controller.js';

export enum ESignUpUsecaseError {
  EmailAlreadyInUse = 'SING_UP_ERROR_EMAIL_ALREADY_IN_USE',
  EmailInvalid = 'EMAIL_INVALID_ERROR_EMAIL_ALREADY_IN_USE',
}

export const SignUpErrors = {
  EmailAlreadyInUse: (email: string): Result<never, UseCaseError<ESignUpUsecaseError>> =>
    Result.fail(
      new UseCaseError<ESignUpUsecaseError>(
        ESignUpUsecaseError.EmailAlreadyInUse,
        `The email ${email} already exists`,
        EHttpStatus.Conflict,
      ),
    ),
  EmailInvalid: (email: string): Result<never, UseCaseError<ESignUpUsecaseError>> =>
    Result.fail(
      new UseCaseError<ESignUpUsecaseError>(
        ESignUpUsecaseError.EmailInvalid,
        `The email ${email} is invalid`,
        EHttpStatus.BadRequest,
      ),
    ),
};
