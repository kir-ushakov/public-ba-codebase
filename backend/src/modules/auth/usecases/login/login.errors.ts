import { Result } from '../../../../shared/core/result.js';
import { UseCaseError } from '../../../../shared/core/use-case-error.js';
import { EHttpStatus } from '../../../../shared/infra/http/models/base-controller.js';

export enum ELoginUsecaseError {
  LoginFailed = 'LOGIN_USECASE_ERROR__AUTHENTICATION_FAILED',
  UserAccountNotVerified = 'LOGIN_USECASE_ERROR__ACCOUNT_NOT_VERIFIED',
}

export const LoginErrors = {
  LoginFailed: (): Result<never, UseCaseError<ELoginUsecaseError>> =>
    Result.fail(
      new UseCaseError<ELoginUsecaseError>(
        ELoginUsecaseError.LoginFailed,
        'Authorization failed!',
        EHttpStatus.BadRequest,
      ),
    ),
  UserAccountNotVerified: (): Result<never, UseCaseError<ELoginUsecaseError>> =>
    Result.fail(
      new UseCaseError<ELoginUsecaseError>(
        ELoginUsecaseError.UserAccountNotVerified,
        'User account not verified!',
        EHttpStatus.BadRequest,
      ),
    ),
};
